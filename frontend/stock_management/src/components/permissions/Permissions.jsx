import React, { useContext, useEffect, useState } from "react";
import { Table, Accordion, Card, Breadcrumb } from "react-bootstrap";
import stockManagementApis from "../apis/StockManagementApis";
import Main from "../layout/Main";
import { Link } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { AuthContext } from "../context/AuthProvider";

const Permissions = () => {
  const [modules, setModules] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const {loginData} = useContext(AuthContext);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const result1 = await stockManagementApis.getModule();
        setModules(Array.isArray(result1) ? result1 : []);
        const result2 = await stockManagementApis.getRoles();
        setRoles(Array.isArray(result2) ? result2 : []);
      } catch (error) {
        setModules([]);
        setRoles([]);
      }
    };
 
    fetchModules();
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      if (selectedRole) {
        try {
          const result = await stockManagementApis.getPermissionById(selectedRole);
          setPermissions(Array.isArray(result) ? result : []);
        } catch (error) {
          setPermissions([]);
        }
      }
    };
    fetchPermissions();
  }, [selectedRole]);

  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
  };

  const handlePermissionChange = (moduleId, permissionType) => {
    setPermissions((prevPermissions) => {
      const existingPermission = prevPermissions.find(
        (p) => p.module_id === moduleId && p.role_id === selectedRole
      );
      if (existingPermission) {
        return prevPermissions.map((p) =>
          p.module_id === moduleId && p.role_id === selectedRole
            ? { ...p, [permissionType]: !p[permissionType] }
            : p
        );
      } else {
        return [
          ...prevPermissions,
          {
            module_id: moduleId,
            role_id: selectedRole,
            view: false,
            add: false,
            edit: false,
            del: false,
            [permissionType]: true,
          },
        ];
      }
    });
  };

  const handleSave = async () => {
    try {
      if (!permissions || permissions.length === 0) {
        toast.info("No permissions to save");
        return;
      }

      const payloads = permissions.map((p) => ({
        ...p,
        role_id: selectedRole,
        updated_by: loginData?.id,
        created_by: loginData?.id,
      }));

      const res = await stockManagementApis.batchSavePermissions(payloads);
      if (res && res.success) {
        toast.success("Permissions saved successfully!");
        if (selectedRole) {
          const updated = await stockManagementApis.getPermissionById(selectedRole);
          setPermissions(Array.isArray(updated) ? updated : []);
        }
      } else {
        toast.error("Failed to save permissions");
      }
    } catch (error) {
      toast.error(error.message || "Failed to save permissions");
    }
  };

  return (
    <Main>
      <div className="my-3 px-3" style={{ position: "relative", left: "10px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            {"Permissions List"}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Card className="px-3 m-3">
        <span
          style={{
            fontSize: "16px",
            marginLeft: "0px",
            height: "40px",
            padding: "5px",
          }}
        >
          Permission List
        </span>
        {roles.map((role) => (
          <Accordion key={role?.id}>
            <Accordion.Item eventKey={role?.id}>
              <Accordion.Header onClick={() => handleRoleSelect(role?.id)}>
                {role.name}
              </Accordion.Header>
              <Accordion.Body>
                {selectedRole === role?.id && (
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th className="bg-light border-0 text-black">Module</th>
                        <th className="bg-light border-0 text-black">Add</th>
                        <th className="bg-light border-0 text-black">Edit</th>
                        <th className="bg-light border-0 text-black">View</th>
                        <th className="bg-light border-0 text-black">Delete</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modules.map((mod) => {
                        let permission = permissions.find(
                          (p) => p.module_id === mod.id && p.role_id === role.id
                        );
                        return (
                          <tr key={mod.id}>
                            <td>{mod.name}</td>
                            <td>
                              <input
                                type="checkbox"
                                checked={permission?.add || false}
                                onChange={() =>
                                  handlePermissionChange(mod.id, "add")
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={permission?.edit || false}
                                onChange={() =>
                                  handlePermissionChange(mod.id, "edit")
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={permission?.view || false}
                                onChange={() =>
                                  handlePermissionChange(mod.id, "view")
                                }
                              />
                            </td>
                            <td>
                              <input
                                type="checkbox"
                                checked={permission?.del || false}
                                onChange={() =>
                                  handlePermissionChange(mod.id, "del")
                                }
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                )}
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        ))}
        <Card.Footer className="mt-2">
          <div>
            <button className="btn btn-primary float-end" onClick={handleSave}>
              Save
            </button>
          </div>
        </Card.Footer>
      </Card>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </Main>
  );
};

export default Permissions;
