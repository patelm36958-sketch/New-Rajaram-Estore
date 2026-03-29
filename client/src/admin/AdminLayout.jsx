import { NavLink, Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

const linkStyle = ({ isActive }) => ({
  fontWeight: isActive ? 700 : 500,
  color: isActive ? "var(--color-forest)" : "var(--color-text)",
  textDecoration: "none",
});

export default function AdminLayout() {
  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link to="/admin" className="brand">
            New Rajaram Estore · Admin
          </Link>
          <nav className="nav">
            <NavLink to="/admin" end style={linkStyle}>
              Dashboard
            </NavLink>
            <NavLink to="/admin/products" style={linkStyle}>
              Products
            </NavLink>
            <NavLink to="/admin/categories" style={linkStyle}>
              Categories
            </NavLink>
            <NavLink to="/admin/orders" style={linkStyle}>
              Orders
            </NavLink>
            <Link to="/">← Storefront</Link>
          </nav>
        </div>
      </header>
      <main className="container flex-grow" style={{ padding: "1.5rem 0 3rem" }}>
        <Outlet />
      </main>
    </>
  );
}
