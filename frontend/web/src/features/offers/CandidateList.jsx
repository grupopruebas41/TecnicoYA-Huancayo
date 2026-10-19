import React from "react";
import CandidateCard from "./CandidateCard";
export default function CandidateList({ candidates = [], ...props }) {
  return (
    <div>
      {candidates.map((c) => (
        <CandidateCard
          key={c.offer_id ?? c.technician.id}
          candidate={c}
          {...props}
        />
      ))}
    </div>
  );
}
