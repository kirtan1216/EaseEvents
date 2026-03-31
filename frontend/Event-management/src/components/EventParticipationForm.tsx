/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { Toast } from "primereact/toast";
import dayjs from "dayjs";
import aa from "../assets/aa.png";
import duration from "dayjs/plugin/duration";
import {
  api,
  useCreateVolunteer,
  useFetchEventByID,
} from "../Queries/Allquery";
import { InputText } from "primereact/inputtext";

dayjs.extend(duration);

interface Countdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const EventParticipationForm: React.FC = () => {
  const { eventId }: any = useParams<{ eventId: string }>();
  const {
    data: event,
    error,
    refetch,
    isLoading: fetchingEvent,
  } = useFetchEventByID(eventId);
  const { mutate: CreateVolunteer } = useCreateVolunteer();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [usertype, setusertype] = useState("participant");
  const [role, setrole] = useState("");
  const [phone, setPhone] = useState("");
  const amount = 500;
  const [isLoading, setIsLoading] = useState(false);
  const toast = useRef<Toast>(null);
  const [showAskPopup, setShowAskPopup] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [answerText] = useState("");

  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        if (document.getElementById("razorpay-script")) {
          resolve(true);
          return;
        }
        const script = document.createElement("script");
        script.id = "razorpay-script";
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    if (!event) return;
    const targetDate = event.date
      ? dayjs(event.date)
      : dayjs("2025-06-0T14:00:00");

    const updateTimer = () => {
      const now = dayjs();
      const diff = dayjs.duration(targetDate.diff(now));
      setCountdown({
        days: diff.days(),
        hours: diff.hours(),
        minutes: diff.minutes(),
        seconds: diff.seconds(),
      });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [event]);

  const showToast = (
    severity: "success" | "error",
    summary: string,
    detail: string,
  ) => {
    if (toast.current) {
      toast.current.show({
        severity,
        summary,
        detail,
        life: 3000,
        style: { zIndex: 9999 },
      });
    } else {
      console.warn("Toast reference is not available");
    }
  };

  const addVolunteer = async () => {
    if (!name || !email || !phone) {
      showToast("error", "Form Error", "Please fill in all the fields.");
      return;
    }
    if (!isValidEmail(email)) {
      showToast(
        "error",
        "Validation Error",
        "Please enter a valid email address.",
      );
      return;
    }
    setIsLoading(true);
    const volunteerdata = { name, email, phone, eventId, role };
    try {
      await CreateVolunteer(volunteerdata);
      showToast("success", "Success", "Successfully joined event as volunteer");
    } catch (error: any) {
      const errorMsg = error.message || "Failed to register as volunteer";
      showToast("error", "Registration Failed", errorMsg);
      console.error("Volunteer Registration Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeRegistration = async () => {
    if (!name || !email || !phone) {
      showToast("error", "Form Error", "Please fill in all the fields.");
      return;
    }
    if (!isValidEmail(email)) {
      showToast(
        "error",
        "Validation Error",
        "Please enter a valid email address.",
      );
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(`${api}/payment/create-order`, {
        amount,
        name,
        email,
        phone,
        eventId,
      });
      showToast(
        "success",
        "Success",
        "Registration successful! Check your email for confirmation.",
      );
      refetch();
    } catch (error: any) {
      console.error("Registration error:", error);
      showToast("error", "Registration Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!name || !email || !phone) {
      const errorMsg = "fill in all details";
      showToast("error", "Registration Failed", errorMsg);
      return;
    }
    if (!isValidEmail(email)) {
      showToast("error", "Registration Failed", "Enter Valid Email Address");
      return;
    }
    setIsLoading(true);
    try {
      const orderResponse = await axios.post(`${api}/payment/create-order`, {
        amount,
        name,
        email,
        phone,
        eventId,
      });
      console.log(orderResponse.data);
      const {
        id: order_id,
        amount: order_amount,
        currency,
      } = orderResponse.data;
      const options = {
        key: "rzp_test_SWAIXprgqfN3mF",

        amount: order_amount,
        currency,
        name: "Event Registration",
        description: "Ticket Payment",
        order_id,
        handler: async function (response: any) {
          // console.log(order_amount);
          try {
            const verifyResponse = await axios.post(
              `${api}/payment/verify-payment`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
              },
            );
            if (verifyResponse.data.success) {
              showToast(
                "success",
                "Success",
                "Payment successful! Check your email for the ticket.",
              );
              refetch();
            } else {
              alert("Payment verification failed!");
            }
          } catch (error) {
            console.error("Verification error:", error);
            showToast(
              "error",
              "error",
              "Payment verification error. Please contact support.",
            );
            // alert("Payment verification error. Please contact support.");
          }
        },
        prefill: { name, email, contact: phone },
        theme: { color: "#3399cc" },
      };
      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Payment error:", error);
      showToast("error", "error", "Payment failed, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (fetchingEvent) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  const isEventPast = dayjs(event.date).isBefore(dayjs());
  if (isEventPast) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-6  rounded-lg  max-w-md mx-auto">
          <h2 className="text-3xl font-bold text-red-600 mb-4">
            Event Participation Ended for {event.title}
          </h2>
          <p className="text-gray-600 mb-4">
            We're sorry, but the event has already concluded. Thank you for your
            interest!
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Toast ref={toast} />
      {/* Ask Question Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowAskPopup(!showAskPopup)}
          className="bg-green-600 text-white p-3 rounded-full shadow-lg hover:bg-green-700"
        >
          Ask
        </button>
      </div>

      {/* Popup Form */}
      {showAskPopup && (
        <div className="fixed bottom-20 right-6 bg-white shadow-xl p-4 rounded-lg z-50 w-80">
          <h3 className="text-lg font-semibold mb-2 text-gray-800">
            Ask a Question
          </h3>
          <InputText
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Type your question here..."
            className="w-full mb-2"
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowAskPopup(false)}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                try {
                  if (!questionText.trim()) {
                    showToast("error", "Error", "Question cannot be empty.");
                    return;
                  }
                  const response = await axios.post(
                    `${api}/event/sendquestion`,
                    {
                      qu: questionText,
                      ans: answerText,
                      eventid: eventId,
                    },
                  );
                  showToast("success", "Success", response.data.message);
                  setQuestionText("");
                  setShowAskPopup(false);
                  refetch(); // Optional, if you want to refresh event data
                } catch (error: any) {
                  console.error("Ask Question Error:", error);
                  showToast(
                    "error",
                    "Failed",
                    error.response?.data?.message ||
                      "Failed to submit question",
                  );
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded"
            >
              Submit
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          backgroundColor: "#F2F2F2",
          backgroundSize: "cover",
          backgroundPosition: "center center",
          backgroundImage: `url(${aa})`,
        }}
        className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-10"
      >
        <h2 className="text-sm uppercase text-gray-600 tracking-widest text-center">
          You're invited to participate in
        </h2>
        <h1 className="text-3xl md:text-4xl font-bold text-green-800 my-3 text-center">
          {event.title}
        </h1>
        <p className="text-lg uppercase text-gray-700 text-center">
          {event.date ? dayjs(event.date).format("DD MMM YYYY") : "Event Date"}{" "}
          at {event.venue}
        </p>
        <p className="text-black font-medium uppercase mt-2 text-center">
          Tickets available:{" "}
          <span className="font-bold">{event.ticketsAvailable}</span>
        </p>
        {/* Live Countdown Timer */}
        <div className="flex flex-wrap justify-center space-x-4 mt-6">
          {Object.entries(countdown).map(([label, value], index) => (
            <div
              key={index}
              className="bg-white p-3 rounded-lg shadow-md text-center w-20 m-2"
            >
              <p className="text-xl font-bold text-green-700">
                {value.toString().padStart(2, "0")}
              </p>
              <p className="text-sm text-gray-500 uppercase">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center bg-white p-6 sm:p-8 md:p-10 rounded-lg shadow-lg">
        <div className="w-full max-w-lg">
          <div className="mb-4">
            <label className="text-green-800 font-semibold">Register as:</label>
            <div className="flex gap-4 mt-2">
              <button
                onClick={() => setusertype("participant")}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  usertype === "participant"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Participant
              </button>
              <button
                onClick={() => setusertype("volunteer")}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  usertype === "volunteer"
                    ? "bg-green-500 text-white shadow-md"
                    : "bg-gray-200 hover:bg-gray-300"
                }`}
              >
                Volunteer
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <form className="space-y-4">
            <InputText
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
            <InputText
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
            <InputText
              type="tel"
              placeholder="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
            {usertype === "volunteer" && (
              <select
                value={role}
                onChange={(e) => setrole(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="" disabled selected>
                  Select a role
                </option>
                <option value="registration">Registration</option>
                <option value="setup">Setup</option>
                <option value="coordinator">Coordinator</option>
                <option value="usher">Usher</option>
                <option value="technical">Technical</option>
                <option value="security">Security</option>
                <option value="general">General</option>
              </select>
            )}
            {usertype === "volunteer" ? (
              <button
                type="button"
                onClick={addVolunteer}
                className={`w-full py-2 text-white rounded-md transition-all duration-200 ${
                  isLoading
                    ? "bg-gray-500 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-800"
                }`}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Register as Volunteer"}
              </button>
            ) : (
              <>
                {event.ticketCategory === "free" ? (
                  <button
                    type="button"
                    onClick={handleFreeRegistration}
                    className={`w-full py-2 text-white rounded-md transition-all duration-200 ${
                      isLoading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-800"
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : "Register"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePayment}
                    className={`w-full py-2 text-white rounded-md transition-all duration-200 ${
                      isLoading
                        ? "bg-gray-500 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-800"
                    }`}
                    disabled={isLoading}
                  >
                    {isLoading ? "Processing..." : `Pay ₹${amount} & Register`}
                  </button>
                )}
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventParticipationForm;
