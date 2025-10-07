import supabase from "../supabaseClient.js";

export default async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Missing token" });

    // validate token
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData?.user) return res.status(401).json({ error: "Invalid token" });

    // Attach user directly from token
    req.user = authData.user;

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ error: "Auth verification failed" });
  }
}
