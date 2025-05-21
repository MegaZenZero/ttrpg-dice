import { useState, useEffect } from "react";
import zoomSdk from "@zoom/appssdk";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  query,
  limitToLast,
} from "firebase/database";
import "./index.css";

const firebaseConfig = {
  apiKey: "AIzaSyCTy3UKnRfwjVN2f0o-xBDYqIblGSu8g7A",
  authDomain: "zoom-ttrpg-dice-app.firebaseapp.com",
  databaseURL: "https://zoom-ttrpg-dice-app-default-rtdb.firebaseio.com",
  projectId: "zoom-ttrpg-dice-app",
  storageBucket: "zoom-ttrpg-dice-app.firebasestorage.app",
  messagingSenderId: "762744886186",
  appId: "1:762744886186:web:ac0af79de61e53440911d3",
  measurementId: "G-YEVKWQYXNB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function TTRPGDice() {
  const [playerName, setPlayerName] = useState("Player");
  const [rollHistory, setRollHistory] = useState([]);
  // Debug states
  const [debugInfo, setDebugInfo] = useState("Initializing...");
  const [zoomContext, setZoomContext] = useState(null);

  useEffect(() => {
    const setupZoomSDK = async () => {
      try {
        setDebugInfo("Configuring Zoom SDK...");
        
        // Configure with the scope you have registered
        await zoomSdk.config({
          capabilities: ["getUserContext"],
          version: "0.16.0" // Specify version for better compatibility
        });
        
        setDebugInfo("Zoom SDK configured successfully. Getting user context...");
        
        // Get user context
        const ctx = await zoomSdk.getUserContext();
        setZoomContext(ctx); // Store for debugging
        
        // Try multiple possible name fields
        const possibleNames = [
          ctx?.displayName,
          ctx?.userName, 
          ctx?.participantName,
          ctx?.screenName,
          ctx?.name
        ].filter(Boolean);
        
        if (possibleNames.length > 0) {
          setPlayerName(possibleNames[0]);
          setDebugInfo(`✅ Success! Using: ${possibleNames[0]} (from ${Object.keys(ctx).join(', ')})`);
        } else {
          setDebugInfo(`❌ No name found. Available properties: ${Object.keys(ctx).join(', ')}`);
        }
        
      } catch (error) {
        setDebugInfo(`❌ Error: ${error.message} (Code: ${error.code || 'unknown'})`);
      }
    };

    setupZoomSDK();

    // Firebase listener setup
    const rollRef = query(ref(db, "rolls"), limitToLast(10));
    const unsub = onChildAdded(rollRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.sides && data.result) {
        setRollHistory((prev) => [data, ...prev.slice(0, 9)]);
      }
    });

    return () => unsub();
  }, []);

  const rollDie = (sides) => {
    const result = Math.floor(Math.random() * sides) + 1;
    const entry = {
      name: playerName || "Player",
      sides,
      result,
      timestamp: Date.now()
    };
    
    console.log("Pushing roll to Firebase:", entry);
    
    push(ref(db, "rolls"), entry)
      .then(() => console.log("✅ Roll pushed to Firebase"))
      .catch((err) => console.error("❌ Firebase push error:", err));
  };

  return (
    <div className="p-4 max-w-md mx-auto rounded-xl shadow-md text-center bg-white">
      <h1 className="text-2xl font-bold mb-2">TTRPG Dice</h1>
      <p className="text-sm text-gray-500 mb-2">
        Tap a die to roll. Everyone sees the result!
      </p>
      
      {/* Debug info box - we'll remove this once it's working */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
        <div className="font-semibold text-blue-800">Debug Info:</div>
        <div className="mt-1">
          <strong>Current Player:</strong> {playerName}<br/>
          <strong>Status:</strong> {debugInfo}
        </div>
        {zoomContext && (
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-600">View Raw Context</summary>
            <pre className="mt-1 text-left bg-gray-100 p-2 rounded overflow-x-auto">
              {JSON.stringify(zoomContext, null, 2)}
            </pre>
          </details>
        )}
      </div>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
          <button
            key={sides}
            onClick={() => rollDie(sides)}
            className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-lg font-medium hover:bg-indigo-700"
          >
            d{sides}
          </button>
        ))}
      </div>
      
      {rollHistory.length > 0 && (
        <div className="mt-4 text-left">
          <h2 className="font-semibold mb-1">Recent Rolls:</h2>
          <ul className="text-sm">
            {rollHistory.map((entry, idx) => (
              <li key={idx}>
                • <span className="text-indigo-700 font-medium">{entry.name || "Player"}</span> rolled d{entry.sides}: {entry.result}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}