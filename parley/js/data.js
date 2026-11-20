// Scenario templates: agents, roles, goals and constraints. Edit freely.
const SCENARIOS = [
  { id: "vendor", icon: "📦", name: "Vendor pricing", color: "#38BDF8",
    tagline: "50 laptops, one deal. Price, delivery and warranty are on the table.",
    topic: "Price · delivery · warranty", level: "Beginner", rounds: 8,
    agents: [
      { id: "buyer", emoji: "🛒", role: "Procurement Manager", side: "Buyer", color: "#7C6CFF",
        wants: ["Total price near $40k", "Delivery within 30 days", "Free 2-year warranty"],
        limits: ["Never above $50k", "Must arrive before quarter end"], fallback: "Buy from a second vendor" },
      { id: "vendor", emoji: "🏷️", role: "Sales Lead", side: "Vendor", color: "#FF6B81",
        wants: ["Close near $58k", "Sell a 3-year support plan", "Payment within 30 days"],
        limits: ["Never below $45k", "Warranty is paid after year 1"], fallback: "Sell the stock to other clients" } ] },
  { id: "job", icon: "💼", name: "Job offer", color: "#2DD4A7",
    tagline: "A candidate and an employer settle salary, bonus and flexibility.",
    topic: "Salary · bonus · remote days", level: "Intermediate", rounds: 10,
    agents: [
      { id: "cand", emoji: "🧑‍💻", role: "Candidate", side: "Job seeker", color: "#2DD4A7",
        wants: ["Salary near $95k", "2 remote days a week", "Signing bonus"],
        limits: ["Never below $82k", "Needs one month to join"], fallback: "Accept a rival offer at $85k" },
      { id: "hr", emoji: "🏢", role: "HR Manager", side: "Employer", color: "#FFC247",
        wants: ["Keep salary near $80k", "Offer stock options over cash", "Start within 30 days"],
        limits: ["Salary band cap $92k", "Maximum 1 remote day"], fallback: "Interview the next candidate" } ] },
  { id: "budget", icon: "📊", name: "Project budget allocation", color: "#FF6B81",
    tagline: "Three department heads split a $500k pool. Everyone wants more.",
    topic: "Shared pool · priorities · reserve", level: "Advanced", rounds: 12,
    agents: [
      { id: "eng", emoji: "🛠️", role: "Engineering Head", side: "Department", color: "#7C6CFF",
        wants: ["$250k for the platform rebuild", "Hire 3 engineers"], limits: ["Needs at least $180k", "Cannot delay launch"], fallback: "Escalate to the CEO" },
      { id: "mkt", emoji: "📣", role: "Marketing Head", side: "Department", color: "#FF6B81",
        wants: ["$220k for the campaign", "Fund a product event"], limits: ["Needs at least $120k", "Campaign starts in Q2"], fallback: "Cut scope, use organic channels" },
      { id: "fin", emoji: "🧮", role: "Finance Director", side: "Department", color: "#2DD4A7",
        wants: ["Keep a 15% reserve ($75k)", "Fund only measurable ROI"], limits: ["Reserve never below $50k", "Needs a cost report"], fallback: "Freeze the unspent pool" } ] }
];

// Personality → behaviour settings (0–100) used later to build the LLM prompt.
const PERSONALITIES = {
  aggressive:    { icon: "🔥", name: "Aggressive",    open: 90, pace: 25, flex: 20, walk: 85, text: "Anchors high, concedes slowly, ready to walk away.", line: "My number is final. Meet it or we stop here." },
  collaborative: { icon: "🤝", name: "Collaborative", open: 50, pace: 65, flex: 85, walk: 25, text: "Looks for win-win trades and shares its reasons.", line: "Let’s build a deal that works for both of us. What matters most to you?" },
  risk:          { icon: "🛡️", name: "Risk-averse",   open: 35, pace: 55, flex: 45, walk: 50, text: "Wants certainty, guarantees and a safe, sure outcome.", line: "I’d like that commitment in writing before we go further." }
};
const METERS = [["Opening boldness", "open"], ["Concession speed", "pace"], ["Flexibility", "flex"], ["Walk-away risk", "walk"]];
