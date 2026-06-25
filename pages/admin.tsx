/**
 * /admin — Supabase Auth-based CMS admin.
 */
import dynamic from "next/dynamic";
const Admin = dynamic(() => import("@/pages/Admin"), { ssr: false });
export default Admin;
