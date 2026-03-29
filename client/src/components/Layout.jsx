import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout, isAdmin } = useAuth();
  const loc = useLocation();

  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/" className="brand">
            New Rajaram Estore
          </Link>
          <nav className="nav" aria-label="Main">
            <Link to="/products">Shop</Link>
            <Link to="/cart">Cart</Link>
            {user ? (
              <>
                {!isAdmin && <Link to="/orders">My orders</Link>}
                {isAdmin && <Link to="/admin">Admin</Link>}
                <span style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
                  {user.name || user.email}
                </span>
                <button type="button" className="btn btn-ghost" onClick={() => logout()}>
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login">Log in</Link>
                <Link to="/register" className="btn btn-primary" style={{ textDecoration: "none" }}>
                  Sign up
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-grow">
        <Outlet key={loc.pathname} />
      </main>
      <footer className="site-footer" role="contentinfo">
        <div className="container site-footer-inner">
          <div className="site-footer-grid">
            <div>
              <h2>New Rajaram Estore</h2>
              <p className="site-footer-tagline">
                Daily groceries and provisions. Order for pickup or delivery — cash on delivery or online pay
                when enabled.
              </p>
              <p style={{ marginTop: "0.75rem", fontSize: "0.9rem" }}>
                <strong style={{ color: "var(--color-text)" }}>Proprietor:</strong> Velaram Samarthram Patel
              </p>
            </div>
            <div>
              <h2>Contact</h2>
              <p>
                <strong style={{ color: "var(--color-text)" }}>Phone:</strong>{" "}
                <a href="tel:+918600072801">8600072801</a>
              </p>
              <p style={{ marginTop: "0.5rem" }}>
                <strong style={{ color: "var(--color-text)" }}>Email:</strong>{" "}
                <a href="mailto:newrajaramprovision@gmail.com">newrajaramprovision@gmail.com</a>
              </p>
            </div>
            <div>
              <h2>Visit us</h2>
              <address>
                At Post Lasur, Bhaji Market, near Shivaji Chowk
                <br />
                Tal. Chopda, Dist. Jalgaon
                <br />
                Maharashtra, India
              </address>
            </div>
          </div>
          <div className="site-footer-bottom">
            © {new Date().getFullYear()} New Rajaram Estore · Velaram Samarthram Patel
          </div>
        </div>
      </footer>
    </>
  );
}
