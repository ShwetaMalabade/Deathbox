import React from "react";
import RecipientsPage from "../../src/components/RecipientsPage";

export default function Recipients() {
  return <RecipientsPage onBack={() => window.history.back()} />;
}
