import logoDark from "../assets/logo-dark.svg";
import logoLight from "../assets/logo-light.svg";

const AthLeadLogo = ({ className = "" }) => (
  <span className={`inline-block ${className}`} role="img" aria-label="AthLead">
    <img
      src={logoDark}
      alt=""
      width="1062"
      height="323"
      className="athlead-logo-dark block h-auto w-full"
    />
    <img
      src={logoLight}
      alt=""
      width="1062"
      height="323"
      className="athlead-logo-light h-auto w-full"
    />
  </span>
);

export default AthLeadLogo;
