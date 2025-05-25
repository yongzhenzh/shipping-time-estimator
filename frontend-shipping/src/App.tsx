import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider } from "antd";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ShippingPage from "./pages/ShippingPage";
import HomePage from "./pages/HomePage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AdminPanel from './pages/AdminPanel'

const App: React.FC = () => {
	console.log("App rendering, setting up routes");
	return (
		<ConfigProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/register" element={<RegisterPage />} />
					<Route
						path="/home"
						element={
							<ProtectedRoute>
								<HomePage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/shipping"
						element={
							<ProtectedRoute>
								<ShippingPage />
							</ProtectedRoute>
						}
					/>
					<Route
						path="/orders"
						element={
							<ProtectedRoute>
								<OrderHistoryPage />
							</ProtectedRoute>
						}
					/>
					<Route
  						path="/admin"
  						element={
    						<ProtectedRoute requireAdmin={true}>
      							<AdminPanel />
    						</ProtectedRoute>
  						}
					/>
					<Route path="/" element={<Navigate to="/home" replace />} />
					{/* Catch-all route to redirect to home */}
					<Route path="*" element={<Navigate to="/home" replace />} />
				</Routes>
			</BrowserRouter>
		</ConfigProvider>
	);
};

export default App;
