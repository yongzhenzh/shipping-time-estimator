import type React from "react";
import { useState } from "react";
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Select,
  DatePicker,
  Row,
  Col,
  Divider,
  Radio,
  Alert,
} from "antd";
import { MailOutlined, CalendarOutlined } from "@ant-design/icons";
import { useShippingCalculator } from '../../utils/useShippingCalculator';
import dayjs from 'dayjs';
import api from '../../utils/api';


const { Title } = Typography;
const { Option } = Select;

interface ShippingFormProps {
  onSubmit?: (values: any) => void;
}

const ShippingForm: React.FC<ShippingFormProps> = ({ onSubmit }) => {
  const [destinationType, setDestinationType] = useState("recipient");
  const [form] = Form.useForm();
  
  const { 
    loading, 
    error, 
    shippingData, 
    calculateShipping,
    validateShippingAddress,
    addressValidationResult 
  } = useShippingCalculator();

  const handleSubmit = async (values: any) => {
    const formattedValues = {
      ...values,
      event_date: values.event_date ? values.event_date.format('YYYY-MM-DD') : undefined,
    };
    
    // First validate address if sending to recipient
    if (destinationType === "recipient" && values.recipient_zip) {
    try {
      const cityOnly = values.recipient_city.split(',')[0].trim();

      await validateShippingAddress({
        street1: values.recipient_address || "",
        city: cityOnly,
        state: values.recipient_state || "",
        postalCode: values.recipient_zip,
        country: "US"
      });
    } catch (error) {
      console.error('Error during address validation:', error);
    }
  }

    
    const eventDate = values.event_date ? values.event_date.format('YYYY-MM-DD') : undefined;
    
    try {
      const result = await calculateShipping({
        senderAddress: {
          postalCode: values.sender_zip,
          country: "US"
        },
        recipientAddress: {
          postalCode: values.recipient_zip || values.sender_zip,
          country: "US"
        },
        package: {
          weight: {
            value: values.weight || 4,
            unit: "ounce"
          },
          dimensions: {
            length: 8.5,
            width: 5.5,
            height: 0.2,
            unit: "inch"
          }
        },
        shippingMethod: values.shipping_method || "standard",
        eventDate: eventDate,
        cardType: "standard_card"
      });
      await api.post('/estimates/save-order', {
      sender_name: values.sender_name,
      recipient_name: values.recipient_name,
      from_postal_code: values.sender_zip,
      to_postal_code: values.recipient_zip || values.sender_zip,
      shipping_method: values.shipping_method,
      occasion: values.occasion,
      event_date: values.event_date?.format('YYYY-MM-DD') || null,
    }, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
      if (result && onSubmit) {
        onSubmit({
          ...formattedValues,
          shippingResult: {
            ...result,
            occasion: values.occasion,
            event_date: eventDate,
          }
        });
      }
    } catch (error) {
      console.error('Error calculating shipping:', error);
    }
  };

  // Map shipping method selection to carrier IDs
  const mapShippingMethodToCarrierId = (method: string) => {
    switch(method) {
      case "standard":
        return "usps";
      case "priority":
        return "usps_priority";
      case "express":
        return "usps_express";
      default:
        return undefined;
    }
  };

  return (
    <Card style={{ maxWidth: 800, margin: "0 auto" }}>
      <Title level={3}>Send a Greeting Card</Title>
      <Form
        name="shipping"
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{ shipping_method: "standard", destination_type: "recipient" }}
        form={form}
      >
        <Divider orientation="left">Event Information</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="event_date"
              label="Event Date"
              rules={[
                { required: true, message: "Please select the event date!" },
              ]}
            >
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="occasion"
              label="Occasion"
              rules={[
                { required: true, message: "Please select the occasion!" },
              ]}
            >
              <Select placeholder="Select occasion">
                <Option value="birthday">Birthday</Option>
                <Option value="anniversary">Anniversary</Option>
                <Option value="wedding">Wedding</Option>
                <Option value="graduation">Graduation</Option>
                <Option value="holiday">Holiday</Option>
                <Option value="other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Shipping Information</Divider>
        <Form.Item
          name="destination_type"
          label="Shipping Destination"
          rules={[{ required: true }]}
        >
          <Radio.Group onChange={(e) => setDestinationType(e.target.value)}>
            <Radio value="recipient">Send Directly to Recipient</Radio>
            <Radio value="customer">Send to Me First</Radio>
          </Radio.Group>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="sender_name"
              label="Sender Name"
              rules={[{ required: true, message: "Please input your name!" }]}
            >
              <Input />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="sender_zip"
              label="Sender ZIP Code"
              rules={[
                { required: true, message: "Please input your ZIP code!" },
              ]}
            >
              <Input />
            </Form.Item>
          </Col>
        </Row>

        {destinationType === "recipient" && (
          <>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="recipient_name"
                  label="Recipient Name"
                  rules={[
                    { required: true, message: "Please input recipient name!" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="recipient_zip"
                  label="Recipient ZIP Code"
                  rules={[
                    {
                      required: true,
                      message: "Please input recipient ZIP code!",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  name="recipient_address"
                  label="Recipient Address"
                  rules={[
                    { required: true, message: "Please input recipient address!" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="recipient_city"
                  label="Recipient City"
                  rules={[
                    { required: true, message: "Please input recipient city!" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="recipient_state"
                  label="Recipient State"
                  rules={[
                    { required: true, message: "Please input recipient state!" },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Form.Item
          name="weight"
          label="Weight"
          rules={[
            { required: true, message: "Please select the card weight!" },
          ]}
          initialValue={4}
        >
          <Select>
            <Option value={1}>1 oz</Option>
            <Option value={2}>2 oz</Option>
            <Option value={3}>3 oz</Option>
            <Option value={4}>4 oz (Standard Card)</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="shipping_method"
          label="Shipping Method"
          rules={[
            { required: true, message: "Please select shipping method!" },
          ]}
        >
          <Select>
            <Option value="standard">Standard (3-5 business days)</Option>
            <Option value="priority">Priority (2-3 business days)</Option>
            <Option value="express">Express (1-2 business days)</Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            size="large"
          >
            Calculate Shipping
          </Button>
        </Form.Item>
      </Form>
      
      {error && (
        <Alert 
          message="Error" 
          description={error} 
          type="error" 
          showIcon 
          style={{ marginTop: 16 }}
        />
      )}
      
      {addressValidationResult && !addressValidationResult.isValid && (
        <Alert
          message="Address Validation Warning"
          description="The recipient address may be invalid. Please check and correct the address."
          type="warning"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      
      {addressValidationResult && addressValidationResult.isValid && (
        <Alert
          message="Address Validated"
          description="The recipient address has been verified."
          type="success"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
      
      {shippingData && (
        <Card title="Shipping Results" style={{ marginTop: 16 }}>
          {shippingData.rates && shippingData.rates.length > 0 ? (
            <>
              <Title level={4}>Available Shipping Options</Title>
              {shippingData.rates.map((rate, index) => (
                <div key={index} style={{ marginBottom: 16, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
                  <strong>{rate.carrier} - {rate.service}</strong>
                  <p>Estimated delivery days: {rate.days} days</p>
                  <p>Cost: ${typeof rate.amount === 'number' ? rate.amount.toFixed(2) : '0.00'} {rate.currency}</p>
                  {rate.days && (
                    <p>Estimated delivery date: {dayjs().add(rate.days, 'day').format('MMMM D, YYYY')}</p>
                  )}
                </div>
              ))}
            </>
          ) : (
            <Alert message="No shipping options found for this route" type="info" />
          )}
          
          {/* Custom timeline calculation based on selected shipping method and event date */}
          {form.getFieldValue('event_date') && shippingData.timeline && (
            <div style={{ marginTop: 16 }}>
              <Title level={4}>Timeline</Title>
              
              {(() => {
                try {
                  const eventDate = dayjs(form.getFieldValue('event_date'));
                  const today = dayjs();
                  const daysUntilEvent = eventDate.diff(today, 'day');
                  
                  // Use the timeline data from the API response
                  const processingDays = shippingData.timeline.processing_days || 1;
                  const deliveryDays = shippingData.timeline.estimated_delivery_days || 5;
                  const totalDays = processingDays + deliveryDays;
                  const orderByDate = eventDate.subtract(totalDays, 'day');
                  
                  return (
                    <>
                      <p>Card processing time: {processingDays} days</p>
                      <p>Shipping time: {deliveryDays} days</p>
                      <p>Days until event: {daysUntilEvent} days</p>
                      
                      {daysUntilEvent < totalDays ? (
                        <Alert
                          message="Warning"
                          description="Based on your selected shipping method, the card may not arrive in time for the event."
                          type="error"
                          showIcon
                        />
                      ) : (
                        <Alert
                          message="Important Reminder"
                          description={`You should order by ${orderByDate.format('MMMM D, YYYY')} to ensure delivery in time for your event.`}
                          type="warning"
                          showIcon
                        />
                      )}
                    </>
                  );
                } catch (error) {
                  console.error('Error calculating timeline:', error);
                  return <Alert message="Could not calculate shipping timeline" type="warning" />;
                }
              })()}
            </div>
          )}
        </Card>
      )}
    </Card>
  );
};

export default ShippingForm;
