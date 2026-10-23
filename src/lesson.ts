import { text, number, flag, list, object, hash, report, unique, safePath, type Lesson, type Input } from "./core";

// A focused local experiment derived from this lesson’s reviewed presentation.
export const lesson: Lesson = {
  number: 12,
  title: "Interrupts, Cancellation and Cleanup",
  description: "People use cancel to describe several different actions. Aborting the browser request stops the browser from waiting.",
  concepts: ["Independent cleanup deadline", "Interrupt acknowledgement is not a stop", "Confirm idle or terminated"],
  scope: "Executes a cleanup state machine with authored provider statuses. No remote interrupt or archive is issued by the local mode. Each run starts from a fresh local seed. The run journal stores results, not production workflow state.",
  cases: [{"id": "0", "label": "Confirm and archive", "input": {"statuses": ["running", "rescheduling", "idle"], "archiveSucceeds": true}, "expected": "passed", "checks": {"remoteStop": "confirmed"}}, {"id": "1", "label": "Preserve stop uncertainty", "input": {"statuses": ["running", "rescheduling"], "archiveSucceeds": true}, "expected": "unconfirmed", "checks": {"remoteStop": "unconfirmed"}}, {"id": "2", "label": "Preserve an archive failure", "input": {"statuses": ["idle"], "archiveSucceeds": false}, "expected": "paused", "checks": {"cleanup": "pending"}}],
  async run(input) {

const statuses=list(input,"statuses").map(String), settled=statuses.find(s=>s==="idle"||s==="terminated");
if(!settled) return report("unconfirmed","No settled state was observed before the cleanup window ended",{remoteStop:"unconfirmed",cleanup:"pending"},["Close host admission","Send interrupt through a fresh cleanup signal","Poll within the independent deadline"]);
const cleanup=settled==="terminated"?"not-needed":flag(input,"archiveSucceeds")?"archived":"pending";
return report(cleanup==="pending"?"paused":"passed","Remote stop and cleanup are distinct outcomes",{remoteStop:"confirmed",lastStatus:settled,cleanup},["Do not reuse an aborted run signal","Rescheduling is not settled","Archive only after confirming idle"]);

  }
};
