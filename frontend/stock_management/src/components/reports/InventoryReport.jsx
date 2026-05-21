import React, { useContext, useEffect, useState } from 'react';
import Main from '../layout/Main';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Breadcrumb, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthProvider';
import Apis from '../apis/StockManagementApis';
function InventoryReport() {
  const { permissions } = useContext(AuthContext);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [report, setReport] = useState([]);

 const fetchReport = async (selectedYear) => {
    try {
      let result = await Apis.getInventoryReport(selectedYear);
      // console.log('result=>',result);
      setReport(result);
    } catch (err) {
      console.error('Error fetching report:', err);
    }
  };

  useEffect(() => {
    fetchReport(year);
  }, [year]);
  
  let hasPermissionAdmin = permissions?.some((role) => role.name === "Admin" || role.name === "Super Admin")
  // console.log('hasPermissionAdmin',hasPermissionAdmin);
  return (
    <Main>
    {/* ( hasPermissionAdmin ? ( */}
      <div className="my-2 mt-4" style={{position: "relative", left: "20px" }}>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}> Home </Breadcrumb.Item> 
            <Breadcrumb.Item active style={{ fontWeight: "bold" }}> Inventory Report </Breadcrumb.Item>
          </Breadcrumb>
      </div>
      <div className="container mt-4 mx-2" >
        <div className="card shadow">
          <div className="card-header d-flex justify-content-between!important align-items-center">
            <h5 className="mb-0 ">Inventory Report </h5>
            <select className="form-select w-25 mx-3 " onChange={(e) => setYear(Number(e.target.value))} value={year} >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="card-body p-0" >
            <div className="table-responsive" style={{position: 'relative',overflow: 'auto',maxHeight: '75vh'}}>
             <Table striped bordered hover style={{borderCollapse: "collapse", width: "100%"}}>
                <thead style={{ position: "sticky",top: "0px",zIndex: "2"}}>
                  <tr>
                    <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Product</th>
                    <th  style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Total Buy Quantity</th>
                    <th  style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Total Issued Quantity</th>
                    <th  style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Issued ({year})</th>
                    <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Issued ({year - 1})</th>
                    <th style={{ 
                    background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)",
                    color:" #ecf0f1ff",
                }} >Closing Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {report.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-3">
                        No data available
                      </td>
                    </tr>
                  ) : (
                    report.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.name}</td>
                  
                        <td>{item.total_buy_quantity}</td>
                        <td>{item.total_issue_quantity}</td>
                        <td>{item.issued_this_year}</td>
                        <td>{item.issued_last_year}</td>
                        <td>{item.closing_stock}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    {/* ):(
      <div>loading...!</div>
    )) */}
    </Main>
  );
}

export default InventoryReport;
