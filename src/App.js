import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchBookings } from "./store/bookingActions";
import { login } from "./services/auth";
import CalendarBoard from "./components/calendar/CalendarBoard";
import ApiBanner from "./components/ApiBanner";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const init = async () => {
      try {
        const token = await login();
        if (token) {
          dispatch(fetchBookings());
        }
      } catch (error) {
        console.log("LOGIN ERROR:", error);
      }
    };

    init();
  }, [dispatch]);

  return (
    <div className="mx-auto max-w-[1450px]">
      <ApiBanner />
      <CalendarBoard />
    </div>
  );
}

export default App;