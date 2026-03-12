import { Order }   from "../models/order.model.js";
import { Product } from "../models/product.model.js";
import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendEmail } from "../config/nodemailer.js";
import { orderConfirmEmail, orderStatusEmail, adminOrderEmail } from "../utils/emailTemplates.js";

// ── POST /api/orders ──────────────────────────────────────────────────────────
export const createOrder = asyncHandler(async (req, res) => {
  const { items, total, addr, phone, payment, userName, userPhone } = req.body;

  if (!items?.length) throw new ApiError(400, "Order must have at least one item");
  if (!addr)          throw new ApiError(400, "Delivery address is required");
  if (!total)         throw new ApiError(400, "Order total is required");

  // Sanitise items — coerce productId to String so numeric seed IDs don't
  // cause Mongoose ObjectId CastErrors.
  const sanitisedItems = items.map(i => ({
    productId: i.productId ? String(i.productId) : null,
    title:     String(i.title),
    price:     Number(i.price),
    qty:       Number(i.qty),
    size:      String(i.size),
    img:       i.img || "",
  }));

  const order = await Order.create({
    user:      req.user._id,
    userName:  userName  || req.user.name  || "",
    userPhone: userPhone || phone          || "",
    items:     sanitisedItems,
    total:     Number(total),
    addr,
    phone:     phone   || "",
    payment:   payment || "cod",
  });

  // ── Decrement stock for real MongoDB products (ignore seed/numeric IDs) ────
  for (const item of sanitisedItems) {
    const pid = item.productId;
    if (!pid || !/^[a-f\d]{24}$/i.test(pid)) continue;
    try {
      const product = await Product.findById(pid);
      if (!product) continue;
      const newQty   = Math.max(0, (product.quantity ?? 100) - item.qty);
      const newStock = newQty <= 0 ? "out" : newQty < 10 ? "low" : "in";
      await Product.findByIdAndUpdate(pid, { $set: { quantity: newQty, stock: newStock } });
    } catch { /* non-critical */ }
  }

  // ── Emails (sendEmail never throws now) ───────────────────────────────────
  sendEmail({
    to:      req.user.email,
    subject: `Order Confirmed — ${order.orderId}`,
    html:    orderConfirmEmail(order, req.user),
  });

  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL;
  if (adminEmail) {
    sendEmail({
      to:      adminEmail,
      subject: `🛍 New Order: ${order.orderId} — £${Number(total).toLocaleString("en-GB")}`,
      html:    adminOrderEmail(order, req.user),
    });
  }

  res.status(201).json(new ApiResponse(201, {
    order: {
      id:     order.orderId,
      _id:    order._id,
      items:  order.items,
      total:  order.total,
      status: order.status,
      date:   order.date,
      addr:   order.addr,
      phone:  order.phone,
      user:   req.user.email,
    },
  }, "Order placed successfully"));
});

// ── GET /api/orders  (admin) ──────────────────────────────────────────────────
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate("user", "name email phone address avatar")
    .sort({ createdAt: -1 });
  res.json(new ApiResponse(200, { orders: orders.map(formatOrder), total: orders.length }));
});

// ── GET /api/orders/my ────────────────────────────────────────────────────────
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(new ApiResponse(200, { orders: orders.map(formatOrder) }));
});

// ── PUT /api/orders/:id/status  (admin) ───────────────────────────────────────
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const allowed = ["pending", "shipped", "delivered", "cancelled"];
  if (!allowed.includes(status)) throw new ApiError(400, `Status must be one of: ${allowed.join(", ")}`);

  const order = await Order.findByIdAndUpdate(
    req.params.id, { status }, { returnDocument: 'after' }
  ).populate("user", "name email");

  if (!order) throw new ApiError(404, "Order not found");

  if (order.user?.email) {
    sendEmail({
      to:      order.user.email,
      subject: `Your order ${order.orderId} has been ${status}`,
      html:    orderStatusEmail(order, order.user),
    });
  }

  res.json(new ApiResponse(200, { order: formatOrder(order) }, "Order status updated"));
});

// ── Helper ────────────────────────────────────────────────────────────────────
function formatOrder(o) {
  const userObj = typeof o.user === "object" ? o.user : null;
  return {
    id:          o.orderId,
    _id:         o._id,
    user:        userObj?.email  || o.user,
    userName:    o.userName      || userObj?.name   || "",
    userPhone:   o.userPhone     || userObj?.phone  || o.phone || "",
    userAddress: userObj?.address || "",
    userAvatar:  userObj?.avatar || "",
    items:       o.items,
    total:       o.total,
    status:      o.status,
    date:        o.date,
    addr:        o.addr,
    phone:       o.phone,
    payment:     o.payment,
  };
}
