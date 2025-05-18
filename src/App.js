import { useState, useEffect } from "react";
import zoomSdk from "@zoom/appssdk";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
  get,
  child,
  remove,
} from "firebase/database";
import "./index.css";

const firebaseConfig = {
  apiKey: "AIzaSyCTy3UKnRfwjVN2f0o-xBDYqIblGSu8g7A",
  authDomain: "zoom-ttrpg-dice-app.firebaseapp.com",
  projectId: "zoom-ttrpg-dice-app",
  storageBucket: "zoom-ttrpg-dice-app.firebasestorage.app",
  messagingSenderId: "762744886186",
  appId: "1:762744886186:web:ac0af79de61e53440911d3",
  measurementId: "G-YEVKWQYXNB"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const getColorForName = (name) => {
  const colors = ["red", "blue", "green", "purple", "orange", "teal", "pink"];
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const getColorClass = (color) => {
  const map = {
    red: "text-red-600",
    blue: "text-blue-600",
    green: "text-green-600",
    purple: "text-purple-600",
    orange: "text-orange-600",
    teal: "text-teal-600",
    pink: "text-pink-600",
  };
  return map[color] || "text-gray-700";
};

export default function TTRPGDice() {
  const [playerName, setPlayerName] = useState("Player");
  const [rollHistory, setRollHistory] = useState([]);

  useEffect(() => {
    zoomSdk.config({ capabilities: ["getUserContext"] })
      .then(() => zoomSdk.getUserContext())
      .then((ctx) => {
        if (ctx?.displayName) setPlayerName(ctx.displayName);
      })
      .catch((err) => console.error("Zoom SDK error:", err));

    const rollRef = ref(db, "rolls");

    onChildAdded(rollRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.text || !data.color) return;

      const entry = { text: data.text, color: data.color };

      setRollHistory((prev) => {
        if (prev.some((e) => e.text === entry.text)) return prev;
        return [entry, ...prev.slice(0, 9)];
      });
    });
  }, []);

  const rollDie = (sides) => {
    const result = Math.floor(Math.random() * sides) + 1;
    const color = getColorForName(playerName);
    const entry = {
      text: `${playerName} rolled d${sides}: ${result}`,
      color,
    };

    const rollRef = ref(db, "rolls");
    push(rollRef, entry).then(() => {
      get(rollRef).then((snapshot) => {
        const allRolls = snapshot.val();
        if (allRolls) {
          const keys = Object.keys(allRolls);
          if (keys.length > 10) {
            const oldestKey = keys[0];
            remove(child(rollRef, oldestKey));
          }
        }
      });
    });
  };

  return (
    <div className="p-4 max-w-md mx-auto rounded-xl shadow-md text-center bg-white">
      <h1 className="text-2xl font-bold mb-2">TTRPG Dice</h1>
      <p className="text-sm text-gray-500 mb-4">Tap a die to roll. Everyone sees the result!</p>
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
              <li key={idx} className={getColorClass(entry.color)}>
                • {entry.text}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
