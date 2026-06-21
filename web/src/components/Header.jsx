import { Clapperboard } from "lucide-react";

export default function Header() {
  return (
    <header className="masthead">
      <div className="logo">
        <Clapperboard size={22} />
      </div>
      <div>
        <h1>Channel Studio AI</h1>
        <p className="sub">Governed faceless video production runtime — Production Floor</p>
      </div>
      <div className="doctrine">
        Claude processes. Code governs.
        <br />
        Records prove. Hooks block.
      </div>
    </header>
  );
}
