"use client";
import React, { useState } from "react";

const initialState = {
  yourName: "",
  recipient1Name: "",
  recipient1Email: "",
  recipient2Name: "",
  recipient2Email: "",
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function RecipientsPage() {
  const [form, setForm] = useState(initialState);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    if (!validateEmail(form.recipient1Email) || !validateEmail(form.recipient2Email)) {
      setError("Please enter valid email addresses for recipients.");
      return;
    }
    localStorage.setItem("deathboxRecipients", JSON.stringify(form));
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <h2 className="mb-8 text-center text-3xl font-bold text-foreground">Add Recipients</h2>
      <form onSubmit={handleSubmit} className="space-y-8 w-full max-w-md">
        {/* Your Name Box */}
        <div className="rounded-2xl border border-amber/30 bg-card p-8 shadow-lg">
          <label className="block mb-2 text-sm font-medium text-amber">Your Full Name</label>
          <input
            type="text"
            name="yourName"
            value={form.yourName}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-amber focus:ring-amber"
          />
        </div>
        {/* Recipient 1 Box */}
        <div className="rounded-2xl border border-success/20 bg-card p-8 shadow-lg">
          <label className="block mb-2 text-sm font-medium text-success">Recipient 1 Name</label>
          <input
            type="text"
            name="recipient1Name"
            value={form.recipient1Name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-success focus:ring-success"
          />
          <label className="block mt-4 mb-2 text-sm font-medium text-success">Recipient 1 Email</label>
          <input
            type="email"
            name="recipient1Email"
            value={form.recipient1Email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-success focus:ring-success"
          />
        </div>
        {/* Recipient 2 Box */}
        <div className="rounded-2xl border border-warning/20 bg-card p-8 shadow-lg">
          <label className="block mb-2 text-sm font-medium text-warning">Recipient 2 Name</label>
          <input
            type="text"
            name="recipient2Name"
            value={form.recipient2Name}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-warning focus:ring-warning"
          />
          <label className="block mt-4 mb-2 text-sm font-medium text-warning">Recipient 2 Email</label>
          <input
            type="email"
            name="recipient2Email"
            value={form.recipient2Email}
            onChange={handleChange}
            required
            className="w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground focus:border-warning focus:ring-warning"
          />
        </div>
        {error && <div className="text-danger text-sm mt-2">{error}</div>}
        <button
          type="submit"
          className="w-full mt-4 rounded-full bg-amber px-6 py-3 text-base font-semibold text-primary-foreground transition-all hover:brightness-110 shadow-lg"
        >
          Save Recipients
        </button>
      </form>
      {success && (
        <div className="mt-6 text-center text-success text-lg font-semibold">
          Recipients saved securely
        </div>
      )}
      <a
        href="/"
        className="mt-8 block w-full max-w-md rounded-full border border-amber/30 bg-background px-6 py-2 text-sm font-medium text-amber text-center transition-colors hover:bg-amber/10"
      >
        Back
      </a>
    </div>
  );
}
