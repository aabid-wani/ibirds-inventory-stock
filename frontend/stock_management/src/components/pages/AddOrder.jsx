import React, { useState, useEffect, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { useForm, useFieldArray } from "react-hook-form";
import stockManagementApis from "../apis/StockManagementApis";
import { AuthContext } from "../context/AuthProvider";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Card,
  Breadcrumb,
} from "react-bootstrap";
import { useParams, Link, NavLink, useNavigate } from "react-router-dom";
import Main from "../layout/Main";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import moment from "moment";

export default function AddOrder() {
  const { loginData } = useContext(AuthContext);
  const { id } = useParams();
  const [vendor, setVendor] = useState([]);
  const [user, setUser] = useState([]);
  const [branch, setBranch] = useState([]);
  const [product, setProduct] = useState([]);
  const navigate = useNavigate();

  const {  register, handleSubmit, setValue, formState: { errors }, reset, control,  watch, } = useForm({
    defaultValues: {
      id: "",
      name: "",
      vendor_id: "",
      invoice_number: "",
      order_date: "",
      status: "active",
      total_amount: 0,
      user_id: loginData.id,
      branch_id: "",
      orderLineItems: [{ product_id: "", price: "", quantity: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "orderLineItems",
  });

  const orderLineItems = watch("orderLineItems") || [];
    const grandTotal = orderLineItems.reduce((sum, item) => {
    const price = parseFloat(item.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return sum + price * quantity;
  }, 0);

  useEffect(() => {
  if (loginData?.id) {
    setValue("user_id", loginData.id);
  }
}, [loginData, setValue]);

  useEffect(() => {
    async function fetchData() {
      try {
        const vendors = await stockManagementApis.getVendor();
        const users = await stockManagementApis.getAllUsers();
        const branches = await stockManagementApis.getBranch();
        const products = await stockManagementApis.getProduct();
        setProduct(products);
        setVendor(vendors);
        setUser(users);
        setBranch(branches);

        if (id) {
          const orderData = await stockManagementApis.getOrderById(id);
          // console.log("orderData", orderData);
          if (orderData.length > 0) {
            const data = orderData[0];
            // Set main order fields
            for (const key in data) {
              if (key !== "orderLineItems") {
                setValue(key, data[key]);
              }
            }
            // Set line items if available
            if (data.orderLineItems) {
              reset({ ...data, orderLineItems: data.orderLineItems });
            } else {
              reset(data);
            }
          }
        }
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    }
    fetchData();
  }, [id, reset, setValue]);

  const watchOrderLineItems = watch("orderLineItems");

  // Calculate total amount whenever line items change
  useEffect(() => {
    if (watchOrderLineItems && watchOrderLineItems.length > 0) {
      const total = watchOrderLineItems.reduce((acc, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return acc + price * quantity;
      }, 0);
      setValue("total_amount", total);
    } else {
      setValue("total_amount", 0);
    }
  }, [watchOrderLineItems, setValue]);

  const onSubmit = async (data) => {

    console.log("Submitted data:", JSON.stringify(data, null, 2));

    try {
      // Ensure at least one line item is present
      if (!data.orderLineItems || data.orderLineItems.length === 0) {
        toast.error("Please add at least one order line item.");
        return;
      }

      const total = data.orderLineItems.reduce((acc, item) => {
        const price = parseFloat(item.price) || 0;
        const quantity = parseInt(item.quantity) || 0;
        return acc + price * quantity;
      }, 0);

    // Update total_amount before sending
      data.total_amount = total;
      data.updated_by = loginData?.id;
      
      // const payload = { ...selectedOrder, updated_by: loginData?.id };

      // If editing an existing order
      if (id) {
        await stockManagementApis.updateOrder(id, data);

        // Optionally update order line items here if your backend supports it
        
        await stockManagementApis.updateOrderLineItem(id, data.orderLineItems);

        toast.success("Order updated successfully");
       } else {
          console.log('data', data);
          
          const payload = { ...data, created_by: loginData?.id };
          const response = await stockManagementApis.AddOrder(payload);
          console.log("orderAddResponse=>", response);
        if (response.success) {
          console.log("Order creation response:", response);
          toast.success("Order and stock updated successfully");
        }
        setTimeout(()=>{
          navigate(`/orderDetailPage/${response.data.id}`);
        },3000);
      }

      reset(); // Reset form after successful submission
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Error submitting order");
    }
  };

  const addItem = () => append({ product_id: "", price: "", quantity: "" });
  const removeItem = (index) => remove(index);
  console.log(removeItem);
  

  return (
    <Main>
      <ToastContainer />
      <Form onSubmit={handleSubmit(onSubmit)}>
        <div className="my-2" style={{ position: "relative", left: "10px" }}>
          <Breadcrumb>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/Home" }}>
              Home
            </Breadcrumb.Item>
            <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/order" }}>
              Order
            </Breadcrumb.Item>
            <Breadcrumb.Item active style={{ fontWeight: "bold" }}>
              {id ? "Edit Order" : "Add Order"}
            </Breadcrumb.Item>
          </Breadcrumb>
        </div>

        <Container fluid>
          <Row className="justify-content-center">
            <Col lg={12}>
              {/* Order Header Card */}
              <Card style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)" }} className="mb-4">
                <Card.Header className="bg-white text-dark d-flex justify-content-between align-items-center">
                  <span style={{ fontSize: "16px", fontWeight: "bold" }}>
                    {id ? "Edit Order" : "Add Order"}
                  </span>
                  <div>
                    <Button variant="primary" type="submit" className="mx-2">
                      Submit
                    </Button>
                    <NavLink to="/order">
                      <Button variant="danger">Cancel</Button>
                    </NavLink>
                  </div>
                </Card.Header>

                <Card.Body>
                  <Row>
                    <Col md={6}>
                      <Form.Group controlId="user_id" className="mb-3">
                        <Form.Label>User</Form.Label>
                        <Form.Control
                          type="text"
                          value={loginData.name}
                          disabled
                          readOnly
                        />
                        
                        {/* <option value={loginData.id}>{loginData.name}</option> */}
                     
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Branch</Form.Label>
                        <Form.Select
                          {...register("branch_id", {
                            required: "Branch is required",
                          })}
                          isInvalid={!!errors.branch_id}
                        >
                          <option value="">Select Branch</option>
                          {branch.map((brc) => (
                            <option key={brc.id} value={brc.id}>
                              {brc.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.branch_id?.message}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Vendor</Form.Label>
                        <Form.Select
                          {...register("vendor_id", {
                            required: "Vendor is required",
                          })}
                          isInvalid={!!errors.vendor_id}
                        >
                          <option value="">Select Vendor</option>
                          {vendor.map((vnd) => (
                            <option key={vnd.id} value={vnd.id}>
                              {vnd.name}
                            </option>
                          ))}
                        </Form.Select>
                        <Form.Control.Feedback type="invalid">
                          {errors.vendor_id?.message}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Invoice Number</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Invoice Number"
                          {...register("invoice_number", {
                            required: "Invoice number is required",
                            pattern: {
                              value: /^[a-zA-Z0-9\-_/]+$/, // Alphanumeric with optional hyphens/underscores/slashes
                              message: "Invoice Number must be alphanumeric only",
                            },
                          })}
                          isInvalid={!!errors.invoice_number}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.invoice_number?.message}
                        </Form.Control.Feedback>
                      </Form.Group>


                      <Form.Group className="mb-3">
                        <Form.Label>Order Date</Form.Label>
                        <Form.Control
                          type="date"
                          max={moment().format("YYYY-MM-DD")}
                          {...register("order_date", {
                            required: "Order Date is required",
                          })}
                          isInvalid={!!errors.order_date}
                        />
                        <Form.Control.Feedback type="invalid">
                          {errors.order_date?.message}
                        </Form.Control.Feedback>
                      </Form.Group>

                      <Form.Group className="mb-3">
                        <Form.Label>Status</Form.Label>
                        <Form.Select {...register("status")}>
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </Form.Select>
                      </Form.Group>

                     <Form.Group className="mb-3">
                        <Form.Label>Total Amount   :  </Form.Label>{grandTotal.toFixed(2)}
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Order Line Items Card */}
              <Card style={{ boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)" }}>
                <Card.Header className="bg-white d-flex justify-content-between">
                  <h3 style={{ fontSize: "16px", fontWeight: "bold" }}>Order Line Items</h3>
                  <Button variant="primary" onClick={addItem}>
                    <i className="fa fa-plus"></i> Add Row
                  </Button>
                </Card.Header>
                <Card.Body>
                  <div style={{ overflow: "auto", maxHeight: "25vh" }}>
                    {/* Remove this nested <Form> - it's not needed */}
                    <Row
                      className="text-white bg-dark py-2"
                      style={{ fontWeight: "bold", fontSize: "16px", background: "radial-gradient(circle at top left, #4f5a66ff, #34495e)"}}
                    >
                      <Col lg={3} className="text-center" >Product</Col>
                      <Col lg={2} className="text-center">Price</Col>
                      <Col lg={2} className="text-center">Quantity</Col>
                      <Col lg={3} className="text-center">Total</Col>
                      <Col lg={2} className="text-center">Action</Col>
                    </Row>

                    {fields.map((item, index) => {
                      const selectedProductId = watch(`orderLineItems.${index}.product_id`);
                      const selectedProduct = product.find((p) => p.id === selectedProductId);
                      // console.log('selectedProduct', selectedProduct);
                       let remaining;
                      if (selectedProduct?.max_quantity == 0 && selectedProduct?.min_quantity == 0) {
                        remaining = selectedProduct?.total_buy_quantity;
                      } else {
                        remaining = selectedProduct ? (selectedProduct.max_quantity ?? 0) -  ((selectedProduct.total_buy_quantity || 0 ) - (selectedProduct.total_issue_quantity || 0)) : 0;
                      }
                      console.log('remaining', remaining);

                      return (
                        <Row
                          key={item.id}
                          className="mt-2 align-items-center"
                          style={{
                            borderBottom: "1px solid #ddd",
                            paddingBottom: 10,
                          }}
                        >
                          {/* Product Select */}
                          <Col lg={3}>
                            <Form.Select
                              {...register(
                                `orderLineItems.${index}.product_id`,
                                {
                                  required: "Product is required",
                                }
                              )}
                              isInvalid={
                                errors?.orderLineItems?.[index]?.product_id
                              }
                            >
                              <option value="">Select Product</option>
                              {product.map((prod) => {
                                let rem;

                                if (prod.max_quantity == 0 && prod.min_quantity == 0) {
                                  rem = prod.total_buy_quantity;
                                } else {
                                  rem = Math.max((prod.max_quantity ?? 0) - ((prod.total_buy_quantity || 0 ) - (prod.total_issue_quantity || 0)), 0);
                                }
                                return (
                                  <option
                                    key={prod.id}
                                    value={prod.id}
                                    disabled={rem <= 0}
                                  >
                                    {prod.name} ({prod.measurement_unit}, {rem}{" "}
                                    add in-stock)
                                  </option>
                                );
                              })}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {
                                errors?.orderLineItems?.[index]?.product_id
                                  ?.message
                              }
                            </Form.Control.Feedback>
                          </Col>

                          {/* Price */}
                          <Col lg={2}>
                            <Form.Control
                              type="number"
                              step="0.00"
                              placeholder="Price"
                              {...register(`orderLineItems.${index}.price`, {
                                required: "Price is required",
                                min: {
                                  value: 0.00,
                                  message: "Price must be greater than 0",
                                },
                              })}
                              isInvalid={errors?.orderLineItems?.[index]?.price}
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors?.orderLineItems?.[index]?.price?.message}
                            </Form.Control.Feedback>
                          </Col>

                          {/* Quantity */}
                          <Col lg={2}>
                            <Form.Control
                              type="number"
                              disabled={remaining <= 0}
                              {...register(`orderLineItems.${index}.quantity`, {
                                required: "Quantity is required",
                                min: {
                                  value: 1,
                                  message: "Minimum quantity is 1",
                                },
                                max: {
                                  value: remaining,
                                  message: `Cannot exceed stock (${remaining})`,
                                },
                              })}
                              isInvalid={
                                errors?.orderLineItems?.[index]?.quantity
                              }
                            />
                            <Form.Control.Feedback type="invalid">
                              {
                                errors?.orderLineItems?.[index]?.quantity
                                  ?.message
                              }
                            </Form.Control.Feedback>
                          </Col>

                          {/* Total */}
                            <Col lg={3} className="text-center">
                            {(() => {
                              const price = parseFloat(watch(`orderLineItems.${index}.price`)) || 0;
                              const quantity = parseInt(watch(`orderLineItems.${index}.quantity`)) || 0;
                              return (price * quantity).toFixed(2);
                            })()}
                          </Col>

                          {/* Remove Button */}
                          <Col lg={2} className="text-center">
                            <Button
                              variant="danger"
                              onClick={() => remove(index)}
                              title="Remove this item"
                            >
                              <i className="fa fa-trash"></i>
                            </Button>
                          </Col>
                        </Row>
                      );
                    })}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </Form>
    </Main>
  );
}
