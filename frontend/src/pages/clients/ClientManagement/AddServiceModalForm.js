import React, { useEffect, useMemo, useState } from "react";
import { Modal, Typography, Space, Divider, Button, message } from "antd";
import { PlusOutlined, MinusOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

function AddServiceModalForm({
  visible,
  onCancel,
  onFinish,
  mainServices = [],
  subServices = [],
  clientId,
  assignedSubServices = [],
}) {
  const [expandedDepartments, setExpandedDepartments] = useState([]);
  const [expandedMains, setExpandedMains] = useState([]);
  const [selectedSubs, setSelectedSubs] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- ASSIGNED SET ---------------- */
  const assignedSet = useMemo(
    () => new Set(assignedSubServices || []),
    [assignedSubServices]
  );

  /* ---------------- GROUP: DEPARTMENT → MAIN → SUB ---------------- */
  const departmentMap = useMemo(() => {
    const map = {};

    // group mains by department
    mainServices.forEach((main) => {
      const deptId = main.team;
      if (!map[deptId]) {
        map[deptId] = {
          team_id: deptId,
          team_name: main.team_name,
          mains: [],
        };
      }
      map[deptId].mains.push(main);
    });

    // attach sub services to main services
    Object.values(map).forEach((dept) => {
      dept.mains.forEach((main) => {
        main.subs = subServices
          .filter(
            (s) =>
              (typeof s.main_service === "object"
                ? s.main_service.id
                : s.main_service) === main.id
          )
          .sort((a, b) => a.name.localeCompare(b.name));
      });

      dept.mains.sort((a, b) => a.name.localeCompare(b.name));
    });

    return Object.values(map).sort((a, b) =>
      a.team_name.localeCompare(b.team_name)
    );
  }, [mainServices, subServices]);

  /* ---------------- RESET ---------------- */
  useEffect(() => {
    if (!visible) {
      setExpandedDepartments([]);
      setExpandedMains([]);
      setSelectedSubs([]);
    }
  }, [visible]);

  /* ---------------- TOGGLES ---------------- */
  const toggleDepartment = (id) => {
    setExpandedDepartments((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleMain = (id) => {
    setExpandedMains((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSub = (id) => {
    if (assignedSet.has(id)) return;

    setSelectedSubs((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async () => {
    const newSubs = selectedSubs.filter((id) => !assignedSet.has(id));

    if (!newSubs.length) {
      return message.error("No new services selected");
    }

    try {
      setLoading(true);

      const payloads = newSubs.map((subId) => {
        const sub = subServices.find((s) => s.id === subId);
        const mainId =
          typeof sub.main_service === "object"
            ? sub.main_service.id
            : sub.main_service;

        return {
          client: clientId,
          main_service: mainId,
          sub_service: subId,
        };
      });

      await onFinish(payloads);
      onCancel();
    } catch (err) {
      console.error(err);
      message.error("Failed to add services");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RENDER ---------------- */
  return (
    <Modal
      open={visible}
      title="Add Services"
      width={900}
      style={{ top: 20}}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="Add Services"
    >
      <Title level={5}>Select Services</Title>

      <Space direction="vertical" style={{ width: "100%" }}>
        {departmentMap.map((dept) => {
          const deptOpen = expandedDepartments.includes(dept.team_id);

          return (
            <div key={dept.team_id}>
              {/* DEPARTMENT */}
              <div
                onClick={() => toggleDepartment(dept.team_id)}
                style={{
                  cursor: "pointer",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  padding: "6px 0",
                }}
              >
                {deptOpen ? <MinusOutlined /> : <PlusOutlined />}
                <Text style={{ marginLeft: 8 }}>{dept.team_name}</Text>
              </div>

              {/* MAIN SERVICES */}
              {deptOpen &&
                dept.mains.map((main) => {
                  const mainOpen = expandedMains.includes(main.id);

                  return (
                    <div key={main.id} style={{ paddingLeft: 24 }}>
                      <div
                        onClick={() => toggleMain(main.id)}
                        style={{
                          cursor: "pointer",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          padding: "4px 0",
                        }}
                      >
                        {mainOpen ? <MinusOutlined /> : <PlusOutlined />}
                        <Text style={{ marginLeft: 8 }}>{main.name}</Text>
                      </div>

                      {/* SUB SERVICES */}
                      {mainOpen && (
                        <Space
                          wrap
                          style={{ paddingLeft: 28, marginTop: 6 }}
                        >
                          {main.subs.map((sub) => {
                            const isAssigned = assignedSet.has(sub.id);
                            const isSelected = selectedSubs.includes(sub.id);

                            return (
                              <Button
                                key={sub.id}
                                size="small"
                                type={isSelected ? "primary" : "default"}
                                disabled={isAssigned}
                                onClick={() => toggleSub(sub.id)}
                              >
                                {sub.name}
                                {isAssigned && " ✓"}
                              </Button>
                            );
                          })}
                        </Space>
                      )}
                    </div>
                  );
                })}

              <Divider style={{ margin: "10px 0" }} />
            </div>
          );
        })}
      </Space>
    </Modal>
  );
}

export default AddServiceModalForm;
