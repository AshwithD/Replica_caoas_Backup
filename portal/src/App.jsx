import React, { useEffect, useState } from "react";
import { api, getToken, getStoredUser, setSession } from "./api";
import { useRoute } from "./router";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import Login from "./views/Login";
import ChangePassword from "./views/ChangePassword";
import Dashboard from "./views/Dashboard";
import Submission from "./views/Submission";
import Employees from "./views/Employees";
import Structures from "./views/Structures";
import Advances from "./views/Advances";

export default function App() {
  const [user, setUser] = useState(getStoredUser());
  const [booting, setBooting] = useState(true);
  const route = useRoute();

  useEffect(() => {
    (async () => {
      if (!getToken()) { setBooting(false); return; }
      try {
        const me = await api.get("/portal/me/");
        setSession(getToken(), me);
        setUser(me);
      } catch {
        setUser(null);
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  if (booting) {
    return (
      <div className="screen-loading">
        <Spinner />
      </div>
    );
  }

  if (!user) return <Login onLogin={setUser} />;

  if (user.must_change_password) {
    return <ChangePassword user={user} onDone={setUser} />;
  }

  let view;
  switch (route.path) {
    case "/input": view = <Submission />; break;
    case "/employees": view = <Employees />; break;
    case "/structures": view = <Structures />; break;
    case "/advances": view = <Advances />; break;
    case "/password": view = <ChangePassword user={user} onDone={setUser} />; break;
    default: view = <Dashboard />;
  }

  return (
    <Layout user={user} route={route} onLogout={() => setUser(null)}>
      {view}
    </Layout>
  );
}
