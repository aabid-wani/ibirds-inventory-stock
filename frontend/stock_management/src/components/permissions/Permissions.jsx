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
            [permissionType]: true,
          },
        ];
      }
    });
  };

  const handleSave = async () => {
    try {
      let allSuccess = true;
      let anySuccess = false;

      for (const permission of permissions) {
        // ✅ Add created_by & updated_by for both create and update
        const payload = {
          ...permission,
          updated_by: loginData?.id,
          ...(permission.id ? {} : { created_by: loginData?.id }),
        };

        let result;

        if (permission.id) {
          result = await stockManagementApis.updatePermission(permission.id, payload);
        } else {
          result = await stockManagementApis.createPermission(payload);
        }

        if (result && result.success) {
          anySuccess = true;
        } else {
          allSuccess = false;
        }
      }

      // ✅ Toast notifications
      if (anySuccess && allSuccess) {
        toast.success('Permissions saved/updated successfully');
      } else if (anySuccess) {
        toast.success('Some permissions saved/updated, some failed');
      } else {
        toast.error('All permission updates failed');
      }
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast.error('Failed to save permissions');
    }
  };

  return (
    <Main>
      <div className="my-2 mt-4" style={{ position: "relative", left: "5px" }}>
        <Breadcrumb>
          <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
            Home
          </Breadcrumb.Item>
          <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
            {"Permissions List"}
          </Breadcrumb.Item>
        </Breadcrumb>
      </div>
      <Card style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15), 0 0 20px rgba(0, 0, 0, 0.1)",}}>
        <span
          style={{
            fontSize: "16px",
            marginLeft: "10px",
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
