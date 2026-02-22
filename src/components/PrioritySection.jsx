import React, { useEffect, useState } from "react";
import axios from "axios";

const CATEGORY_RULES = [
  { key: "urgent", match: /insurance|COBRA|claim|deadline/i },
  { key: "money", match: /401k|HSA|paycheck|benefits/i },
  { key: "debts", match: /loan|mortgage|debt/i },
  { key: "subscriptions", match: /Netflix|Spotify|subscription/i },
];

const SECTION_LABELS = {
  urgent: "Urgent Deadlines",
  money: "Money & Benefits",
  debts: "Debts & Obligations",
  subscriptions: "Subscriptions to Cancel",
};

function categorizeLines(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const categorized = { urgent: [], money: [], debts: [], subscriptions: [] };
  for (const line of lines) {
    let found = false;
    for (const { key, match } of CATEGORY_RULES) {
      if (match.test(line)) {
        categorized[key].push(line);
        found = true;
        break;
      }
    }
    if (!found) {
      // Optionally, could add to an "other" category
    }
  }
  return categorized;
}

export default function PrioritySection() {
  const [data, setData] = useState({ urgent: [], money: [], debts: [], subscriptions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .post("http://localhost:8000/generate")
      .then((res) => {
        const categorized = categorizeLines(res.data);
        setData(categorized);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load data. Please try again.");
        setLoading(false);
      });
  }, []);

  return (
    <section className="relative px-6 py-32 md:py-40">
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-4xl font-bold text-foreground md:text-5xl">
          Everything organized by priority
        </h2>
        {loading && (
          <div className="text-center text-lg text-muted-foreground py-8">
            Generating financial afterlife package...
          </div>
        )}
        {error && (
          <div className="text-center text-danger py-8">{error}</div>
        )}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {Object.entries(SECTION_LABELS).map(([key, label]) => (
              <div key={key} className="rounded-xl border bg-card p-6">
                <h3 className="mb-4 text-xl font-semibold text-foreground">{label}</h3>
                {data[key].length === 0 ? (
                  <p className="text-muted-foreground">No items found.</p>
                ) : (
                  <ul className="list-disc pl-5 space-y-2">
                    {data[key].map((item, idx) => (
                      <li key={idx} className="text-foreground">{item}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
