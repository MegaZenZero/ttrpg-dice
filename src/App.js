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
  // Your real config here
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function TTRPGDice() {
  const [playerName, setPlayerName] = useState("Player");
  const [rollHistory, setRollHistory] = useState([]);

  useEffect(() => {
    // Grab user context safely
    zoomSdk
      .config({ capabilities: ["getUserContext"] })
      .then(() => zoomSdk.getUserContext())
      .then((ctx) => {
        if (ctx?.displayName) {
          setPlayerName(ctx.displayName);
        } else {
          console.warn("Zoom context did not include displayName");
        }
      })
      .catch((err) => {
        console.error("Failed to get Zoom user context", err);
      });

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
    };
    push(ref(db, "rolls"), entry);
  };

  return (
    <div className="p-4 max-w-md mx-auto rounded-xl shadow-md text-center bg-white">
      <h1 className="text-2xl font-bold mb-2">TTRPG Dice</h1>
      <p className="text-sm text-gray-500 mb-4">
        Tap a die to roll. Everyone sees the result!
      </p>
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
