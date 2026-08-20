import React, { useEffect, useState } from "react";
import { Modal, Form, Select, DatePicker, Input, message, Space, Button, Row, Col } from "antd";
import dayjs from "dayjs";
import { api } from "../../../services/api";

const { Option } = Select;
const { TextArea } = Input;

const AddTimeEntryModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const [subServices, setSubServices] = useState([]);
  const [mainServices, setMainServices] = useState([]);

  const handleQuickAdd = (minutes) => {
    const start = form.getFieldValue("start_time");
    const end = form.getFieldValue("end_time");

    if (!start) {
        message.warning("Please select start time first");
        return;
    }

    const startDt = dayjs(start);
    const now = dayjs();
    const maxEnd = startDt.add(15, "hour");

    let base = end ? dayjs(end) : startDt;
    let newEnd = base.add(minutes, "minute");

    // Rule: 15 hour limit
    if (newEnd.isAfter(maxEnd)) {
        newEnd = maxEnd;
        message.info("15-hour limit reached");
    }

    // Rule: No future time
    if (newEnd.isAfter(now)) {
        newEnd = now;
        message.info("Future time not allowed");
    }

    // Rule: End > Start
    if (!newEnd.isAfter(startDt)) {
        message.error("End time must be after start time");
        return;
    }

    form.setFieldValue("end_time", newEnd);
    form.validateFields(["end_time"]);
    };


  // ----------------------------------
  // Load dropdown data (SAME AS TASK MODAL)
  // ----------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, mainRes] = await Promise.all([
          api.get("/clients/subservices/"),
          api.get("/clients/mainservices/")
        ]);

        setSubServices(subRes.data || []);
        setMainServices(mainRes.data || []);
      } catch (err) {
        message.error("Failed to load descriptions");
        console.error("Description API error:", err);
      }
    };

    if (open) {
      fetchData();
      form.resetFields();
    }
  }, [open, form]);

  // ----------------------------------
  // Filter ONLY "General" Team
  // ----------------------------------
  const generalDescriptions = subServices.filter(sub => {
    const mainService = mainServices.find(
      ms => ms.id === sub.main_service
    );

    return mainService?.team_name === "General" || mainService?.team === "General";
  });

  // ----------------------------------
  // Save Handler
  // ----------------------------------
  const submit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const start = values.start_time;
      const end = values.end_time;

      if (!end.isAfter(start)) {
        message.error("End time must be after start time");
        return;
      }

      await api.post("/clients/internal-time-entry/", {
        description: values.description,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        notes: values.note || "",
        status: values.status || "In Progress"
      });


      message.success("Time entry added");
      form.resetFields();
      onSuccess();
      onClose();
    } catch (err) {
        console.log("FULL ERROR =>", err.response?.data);

        let errorMsg = "Failed to add time entry";

        const data = err.response?.data;

        if (!data) {
            errorMsg = "Server not reachable";
        }
        else if (typeof data === "string") {
            errorMsg = data;
        }
        else if (data.detail) {
            errorMsg = data.detail;
        }
        else if (data.non_field_errors) {
            errorMsg = data.non_field_errors[0];
        }
        else {
            // field errors (start_time, end_time, etc)
            const firstKey = Object.keys(data)[0];
            if (firstKey && Array.isArray(data[firstKey])) {
            errorMsg = data[firstKey][0];
            } else {
            errorMsg = JSON.stringify(data);
            }
        }

    message.error(errorMsg);
    } finally {
    setLoading(false);
    }
    };

  // ----------------------------------
  // ENTER KEY = SAVE
  // ----------------------------------
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.tagName === "TEXTAREA") return;
      e.preventDefault();
      submit();
    }
  };

  

  return (
    <Modal
      title="Add Time Entry"
      open={open}
      onOk={submit}
      onCancel={onClose}
      confirmLoading={loading}
      okText="Save Entry"
    >
      <div onKeyDown={handleKeyDown}>
        <Form form={form} layout="vertical">

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: "Please select a description" }]}
          >
            <Select
              showSearch
              placeholder="Select description"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children
                  ?.toLowerCase()
                  .includes(input.toLowerCase())
              }
            >
              {generalDescriptions.map(sub => (
                <Option key={sub.id} value={sub.id}>
                  {sub.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={12}>
            {/* START TIME */}
            <Col span={12}>
                <Form.Item
                name="start_time"
                label="Start Time"
                rules={[{ required: true, message: "Please select start time" }]}
                >
                <DatePicker
                    showTime={{
                    minuteStep: 1,
                    use12Hours: true,
                    format: "h:mm A"
                    }}
                    format="YYYY-MM-DD h:mm A"
                    style={{ width: "100%" }}
                    placeholder="Start time"
                    disabledDate={(current) =>
                    current && current > dayjs().endOf("day")
                    }
                />
                </Form.Item>
            </Col>

            {/* END TIME */}
            <Col span={12}>
                <Form.Item
                name="end_time"
                label="End Time"
                dependencies={["start_time"]}
                rules={[
                    { required: true, message: "Please select end time" },
                    ({ getFieldValue }) => ({
                    validator(_, value) {
                        const start = getFieldValue("start_time");
                        if (!value || !start) return Promise.resolve();

                        const startDt = dayjs(start);
                        const endDt = dayjs(value);
                        const now = dayjs();

                        if (endDt <= startDt) {
                        return Promise.reject(
                            new Error("End time must be after start time")
                        );
                        }

                        if (endDt.diff(startDt, "hour", true) > 15) {
                        return Promise.reject(
                            new Error("Time entry cannot exceed 15 hours")
                        );
                        }

                        if (endDt.isAfter(now.add(1, "minute"))) {
                        return Promise.reject(
                            new Error("Future time not allowed")
                        );
                        }

                        return Promise.resolve();
                    }
                    })
                ]}
                >
                <DatePicker
                    showTime={{
                    minuteStep: 1,
                    use12Hours: true,
                    format: "h:mm A"
                    }}
                    format="YYYY-MM-DD h:mm A"
                    style={{ width: "100%" }}
                    placeholder="End time"
                    disabledDate={(current) => {
                    const start = form.getFieldValue("start_time");
                    if (!start) return false;

                    const startDt = dayjs(start);
                    const maxDt = startDt.add(15, "hour");
                    const now = dayjs();

                    const upperLimit = maxDt.isBefore(now) ? maxDt : now;

                    return (
                        current.isBefore(startDt.startOf("day")) ||
                        current.isAfter(upperLimit.endOf("day"))
                    );
                    }}
                    disabledTime={(current) => {
                    const start = form.getFieldValue("start_time");
                    if (!start || !current) return {};

                    const startDt = dayjs(start);
                    const maxDt = startDt.add(15, "hour");
                    const now = dayjs();

                    const upperLimit = maxDt.isBefore(now) ? maxDt : now;

                    return {
                        disabledHours: () => {
                        const hours = [];
                        for (let h = 0; h < 24; h++) {
                            const test = current.hour(h).minute(0);
                            if (
                            test.isBefore(startDt) ||
                            test.isAfter(upperLimit)
                            ) {
                            hours.push(h);
                            }
                        }
                        return hours;
                        },
                        disabledMinutes: (hour) => {
                        const minutes = [];
                        for (let m = 0; m < 60; m++) {
                            const test = current.hour(hour).minute(m);
                            if (
                            test.isBefore(startDt) ||
                            test.isAfter(upperLimit)
                            ) {
                            minutes.push(m);
                            }
                        }
                        return minutes;
                        }
                    };
                    }}
                />
                </Form.Item>
                {/* QUICK ADD BUTTONS */}
                <Space size="small" style={{ marginTop: -6 }}>
                <Button size="small" onClick={() => handleQuickAdd(5)}>+5m</Button>
                <Button size="small" onClick={() => handleQuickAdd(10)}>+10m</Button>
                <Button size="small" onClick={() => handleQuickAdd(30)}>+30m</Button>
                <Button size="small" onClick={() => handleQuickAdd(60)}>+1h</Button>
                </Space>

                {/* DURATION */}
                <Form.Item
                noStyle
                shouldUpdate={(prev, curr) =>
                    prev?.start_time !== curr?.start_time ||
                    prev?.end_time !== curr?.end_time
                }
                >
                {() => {
                    const start = form.getFieldValue("start_time");
                    const end = form.getFieldValue("end_time");

                    if (!start || !end) return null;

                    const mins = dayjs(end).diff(dayjs(start), "minute");

                    return (
                    <div style={{ marginTop: 4, color: "#52c41a", fontSize: 12 }}>
                        ⏱ Duration: {Math.floor(mins / 60)}h {mins % 60}m
                    </div>
                    );
                }}
                </Form.Item>
                </Col>
                </Row>

            




          <Form.Item name="note" label="Comment"
          rules={[{ required: true, message: "Please enter Comment" }]}>
            <TextArea rows={3} placeholder="Enter Comment" />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Please select status" }]}
          >
            <Select placeholder="Select status">
              <Option value="In Progress">In Progress</Option>
              <Option value="Done">Done</Option>
            </Select>
          </Form.Item>

        </Form>
      </div>
    </Modal>
  );
};

export default AddTimeEntryModal;
