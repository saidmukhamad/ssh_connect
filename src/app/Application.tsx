import React, { useState, useEffect, createContext, useContext } from "react";
import { BrowserRouter as Router, Route, Link, NavLink, useNavigate, Routes } from "react-router-dom";
import { Provider, TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { X, Menu, User, LogOut } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// Shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Redux store setup
interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const authSlice = createSlice({
  name: "auth",
  initialState: {
    isAuthenticated: false,
    user: null,
    token: null,
  } as AuthState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
    },
  },
});

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

const useAppDispatch = () => useDispatch<AppDispatch>();
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// API service
const API_URL = import.meta.env.REACT_APP_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      store.dispatch(authSlice.actions.logout());
    }
    return Promise.reject(error);
  }
);

// Theme context
type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

// Components
const Header: React.FC<{ toggleSidebar: () => void }> = ({ toggleSidebar }) => {
  const dispatch = useAppDispatch();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    dispatch(authSlice.actions.logout());
  };

  return (
    <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Tour Provider Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === "light" ? "🌙" : "☀️"}
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-6 w-6" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-6 w-6" />
        </Button>
      </div>
    </header>
  );
};

const Sidebar: React.FC<{ isOpen: boolean; toggleSidebar: () => void }> = ({ isOpen, toggleSidebar }) => {
  return (
    <div
      className={`bg-gray-100 w-64 h-full fixed top-0 left-0 overflow-y-auto transition-transform duration-300 ease-in-out transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="p-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="float-right">
          <X className="h-6 w-6" />
        </Button>
        <h2 className="text-xl font-bold mb-4">Menu</h2>
        <nav>
          <ul className="space-y-2">
            <li>
              <NavLink to="/" className="block py-2 px-4 hover:bg-gray-200" activeClassName="bg-gray-200 font-bold">
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/tours" className="block py-2 px-4 hover:bg-gray-200" activeClassName="bg-gray-200 font-bold">
                Tours
              </NavLink>
            </li>
            <li>
              <NavLink to="/bookings" className="block py-2 px-4 hover:bg-gray-200" activeClassName="bg-gray-200 font-bold">
                Bookings
              </NavLink>
            </li>
            <li>
              <NavLink to="/analytics" className="block py-2 px-4 hover:bg-gray-200" activeClassName="bg-gray-200 font-bold">
                Analytics
              </NavLink>
            </li>
            <li>
              <NavLink to="/settings" className="block py-2 px-4 hover:bg-gray-200" activeClassName="bg-gray-200 font-bold">
                Settings
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-200 p-6">{children}</main>
      </div>
    </div>
  );
};

// Pages
const Dashboard: React.FC = () => {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Tours</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">10</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">50</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$5,000</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Average Rating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">4.5</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Tours: React.FC = () => {
  const [tours, setTours] = useState([
    { id: 1, name: "City Tour", price: 50, duration: 3, maxParticipants: 20 },
    { id: 2, name: "Mountain Hike", price: 80, duration: 6, maxParticipants: 15 },
    { id: 3, name: "Beach Adventure", price: 65, duration: 4, maxParticipants: 25 },
  ]);

  const [newTour, setNewTour] = useState({ name: "", price: 0, duration: 0, maxParticipants: 0 });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTour({ ...newTour, [name]: name === "name" ? value : Number(value) });
  };

  const handleAddTour = () => {
    setTours([...tours, { id: tours.length + 1, ...newTour }]);
    setNewTour({ name: "", price: 0, duration: 0, maxParticipants: 0 });
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Tours</h2>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Tour</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <Label htmlFor="name">Tour Name</Label>
              <Input id="name" name="name" value={newTour.name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="price">Price</Label>
              <Input id="price" name="price" type="number" value={newTour.price} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="duration">Duration (hours)</Label>
              <Input id="duration" name="duration" type="number" value={newTour.duration} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="maxParticipants">Max Participants</Label>
              <Input id="maxParticipants" name="maxParticipants" type="number" value={newTour.maxParticipants} onChange={handleInputChange} />
            </div>
            <Button type="button" onClick={handleAddTour}>
              Add Tour
            </Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tour List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Name</th>
                <th className="text-left">Price</th>
                <th className="text-left">Duration</th>
                <th className="text-left">Max Participants</th>
              </tr>
            </thead>
            <tbody>
              {tours.map((tour) => (
                <tr key={tour.id}>
                  <td>{tour.name}</td>
                  <td>${tour.price}</td>
                  <td>{tour.duration} hours</td>
                  <td>{tour.maxParticipants}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

const Bookings: React.FC = () => {
  const [bookings, setBookings] = useState([
    { id: 1, tourName: "City Tour", customerName: "John Doe", date: "2023-07-15", participants: 3, status: "Confirmed" },
    { id: 2, tourName: "Mountain Hike", customerName: "Jane Smith", date: "2023-07-20", participants: 2, status: "Pending" },
    { id: 3, tourName: "Beach Adventure", customerName: "Bob Johnson", date: "2023-07-25", participants: 4, status: "Confirmed" },
  ]);

  const handleStatusChange = (id: number, newStatus: string) => {
    setBookings(bookings.map((booking) => (booking.id === id ? { ...booking, status: newStatus } : booking)));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Bookings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Booking List</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Tour</th>
                <th className="text-left">Customer</th>
                <th className="text-left">Date</th>
                <th className="text-left">Participants</th>
                <th className="text-left">Status</th>
                <th className="text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.tourName}</td>
                  <td>{booking.customerName}</td>
                  <td>{booking.date}</td>
                  <td>{booking.participants}</td>
                  <td>{booking.status}</td>
                  <td>
                    <Select value={booking.status} onValueChange={(value) => handleStatusChange(booking.id, value)}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

const Analytics: React.FC = () => {
  const [revenueData] = useState([
    { month: "Jan", revenue: 5000 },
    { month: "Feb", revenue: 6000 },
    { month: "Mar", revenue: 7500 },
    { month: "Apr", revenue: 8000 },
    { month: "May", revenue: 9000 },
    { month: "Jun", revenue: 10000 },
  ]);

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Analytics</h2>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="revenue" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top Tours</CardTitle>
          </CardHeader>
          <CardContent>
            <ul>
              <li>City Tour - 50 bookings</li>
              <li>Mountain Hike - 35 bookings</li>
              <li>Beach Adventure - 30 bookings</li>
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Customer Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-4xl font-bold">4.7/5</p>
              <p>Based on 150 reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Settings: React.FC = () => {
  const [settings, setSettings] = useState({
    companyName: "Adventure Tours",
    email: "info@adventuretours.com",
    phone: "+1 (555) 123-4567",
    notifyNewBookings: true,
    notifyLowInventory: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the settings to your backend
    console.log("Settings updated:", settings);
    alert("Settings updated successfully!");
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" name="companyName" value={settings.companyName} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={settings.email} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" name="phone" value={settings.phone} onChange={handleInputChange} />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyNewBookings"
                name="notifyNewBookings"
                checked={settings.notifyNewBookings}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyNewBookings: checked as boolean })}
              />
              <Label htmlFor="notifyNewBookings">Notify on new bookings</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="notifyLowInventory"
                name="notifyLowInventory"
                checked={settings.notifyLowInventory}
                onCheckedChange={(checked) => setSettings({ ...settings, notifyLowInventory: checked as boolean })}
              />
              <Label htmlFor="notifyLowInventory">Notify on low inventory</Label>
            </div>
            <Button type="submit">Save Settings</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post("/auth/login", { email, password });
      dispatch(authSlice.actions.setCredentials(response.data));
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      alert("Login failed. Please check your credentials and try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full">
              Login
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const dispatch = useAppDispatch();
  const history = useNavigate();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    try {
      const response = await api.post("/auth/register", formData);
      dispatch(authSlice.actions.setCredentials(response.data));
      history("/");
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleInputChange} required />
            </div>
            <Button type="submit" className="w-full">
              Register
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode; path: string; exact?: boolean }> = ({ children, ...rest }) => {
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated);
  //   <Route
  //   {...rest}
  //   render={({ location }) =>
  //     isAuthenticated ? (
  //       children
  //     ) : (
  //       <Redirect
  //         to={{
  //           pathname: "/login",
  //           state: { from: location },
  //         }}
  //       />
  //     )
  //   }
  // />
  // );
  return children;
};

const Application: React.FC = () => {
  return (
    <Provider store={store}>
      <ThemeProvider>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />

          <Route
            path="/"
            element={
              <Layout>
                <Dashboard />{" "}
              </Layout>
            }
          />
          <Route
            path="/tours"
            element={
              <Layout>
                <Tours />
              </Layout>
            }
          />
          <Route
            path="/bookings"
            element={
              <Layout>
                <Bookings />
              </Layout>
            }
          />
          <Route
            path="/analytics"
            element={
              <Layout>
                <Analytics />
              </Layout>
            }
          />
          <Route
            path="/settings"
            element={
              <Layout>
                <Settings />
              </Layout>
            }
          />
        </Routes>
      </ThemeProvider>
    </Provider>
  );
};

export default Application;
