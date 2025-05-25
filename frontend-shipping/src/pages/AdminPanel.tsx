import React, { useEffect, useState } from 'react';
import { Table, Typography, message, Button } from 'antd';
import { useNavigate } from 'react-router-dom';


const { Title } = Typography;

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUserData] = useState<any[]>([]);
  const [records, setRecordData] = useState<any[]>([]);

useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("No token found, cannot fetch admin data.");
    return;
  }
  
  fetch("http://localhost:3001/admin/users", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setUserData(data);
      } else {
        console.error("Expected an array but got:", data);
        setUserData([]); // fallback to empty array
      }
    });

  fetch("http://localhost:3001/admin/shipping-records", {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setRecordData(data);
      } else {
        console.error("Expected an array but got:", data);
        setRecordData([]); // fallback
      }
    });
}, []);


  return (
    <div style={{ padding: '40px' }}>
      <Title level={2}>Admin Panel</Title>

      {/*Back Button */}
      <Button type="default" onClick={() => navigate('/home')} style={{ marginBottom: 24 }}>
        ← Back to Home
      </Button>

      <div style={{ marginBottom: 32 }}>
        <Title level={4}>User Accounts</Title>
        <Table
          dataSource={users}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'ID', dataIndex: 'id' },
            { title: 'Username', dataIndex: 'username' },
            { title: 'Email', dataIndex: 'email' },
            { title: 'Role', dataIndex: 'role' },
          ]}
        />
      </div>

      <div>
        <Title level={4}>Shipping Records</Title>
        <Table
          dataSource={records}
          rowKey="id"
          pagination={{ pageSize: 5 }}
          columns={[
            { title: 'Username', dataIndex: 'username' },
            { title: 'Sender', dataIndex: 'sender_name' },
            { title: 'Recipient', dataIndex: 'recipient_name' },
            { title: 'From ZIP', dataIndex: 'zip_from' },
            { title: 'To ZIP', dataIndex: 'zip_to' },
            { title: 'Occasion', dataIndex: 'occasion' },
            { title: 'Shipping Method', dataIndex: 'shipping_method' },
            { title: 'Order Date', dataIndex: 'ordered_date' },
            { title: 'Delivery Date', dataIndex: 'delivery_date' },
          ]}
        />
      </div>
    </div>
  );
};

export default AdminPanel;
