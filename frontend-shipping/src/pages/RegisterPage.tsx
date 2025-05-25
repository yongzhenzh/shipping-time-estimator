import React, { useState } from "react";
import { Form, Input, Button, Card, Typography, message } from "antd";
import { UserOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { authService } from "../utils/api";
import axios from "axios";

const { Title } = Typography;

const RegisterPage: React.FC = () => {
	const [loading, setLoading] = useState(false);
	const navigate = useNavigate();

	const onFinish = async (values: any) => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3001/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      message.success("Registration successful! Please log in.");
      navigate("/login");
    } catch (error: any) {
      message.error(error.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };
	return (
		<Card style={{ maxWidth: 400, margin: "0 auto", marginTop: 50 }}>
			<Title level={2} style={{ textAlign: "center" }}>
				Create an Account
			</Title>
			<Form
				name="register"
				onFinish={onFinish}
				layout="vertical"
				scrollToFirstError
			>
				<Form.Item
					name="username"
					rules={[
						{
							required: true,
							message: "Please input your username!",
						},
					]}
				>
					<Input
						prefix={<UserOutlined />}
						placeholder="Username"
						size="large"
					/>
				</Form.Item>

				<Form.Item
					name="email"
					rules={[
						{
							type: "email",
							message: "The input is not valid email!",
						},
						{
							required: true,
							message: "Please input your email!",
						},
					]}
				>
					<Input prefix={<MailOutlined />} placeholder="Email" size="large" />
				</Form.Item>

				<Form.Item
					name="password"
					rules={[
						{
							required: true,
							message: "Please input your password!",
						},
						{
							min: 6,
							message: "Password must be at least 6 characters!",
						},
					]}
					hasFeedback
				>
					<Input.Password
						prefix={<LockOutlined />}
						placeholder="Password"
						size="large"
					/>
				</Form.Item>

				<Form.Item
					name="confirm"
					dependencies={["password"]}
					hasFeedback
					rules={[
						{
							required: true,
							message: "Please confirm your password!",
						},
						({ getFieldValue }) => ({
							validator(_, value) {
								if (!value || getFieldValue("password") === value) {
									return Promise.resolve();
								}
								return Promise.reject(
									new Error("The two passwords do not match!"),
								);
							},
						}),
					]}
				>
					<Input.Password
						prefix={<LockOutlined />}
						placeholder="Confirm Password"
						size="large"
					/>
				</Form.Item>

				<Form.Item>
					<Button
						type="primary"
						htmlType="submit"
						loading={loading}
						block
						size="large"
					>
						Register
					</Button>
				</Form.Item>

				<div style={{ textAlign: "center" }}>
					Already have an account?{" "}
					<Button
						type="link"
						onClick={() => navigate("/login")}
						style={{ padding: 0 }}
					>
						Log in
					</Button>
				</div>
			</Form>
		</Card>
	);
};

export default RegisterPage;
