export const verificationEmail = (name, verifyUrl) => `
  <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#fff;">
    <h1 style="font-size:32px;font-weight:300;letter-spacing:4px;margin-bottom:4px;">BaltiCo</h1>
    <p style="font-size:10px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:32px;">Verify Your Email</p>
    <p style="font-size:15px;line-height:1.8;color:#333;">Hi <strong>${name}</strong>,</p>
    <p style="font-size:15px;line-height:1.8;color:#333;">Thank you for creating an account. Please verify your email address to complete your registration.</p>
    <p style="font-size:13px;line-height:1.8;color:#777;">This link expires in <strong>24 hours</strong>.</p>
    <div style="margin:32px 0;text-align:center;">
      <a href="${verifyUrl}"
        style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;padding:16px 40px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">
        VERIFY EMAIL
      </a>
    </div>
    <p style="font-size:12px;color:#aaa;word-break:break-all;">Or copy this link: ${verifyUrl}</p>
    <p style="font-size:12px;color:#bbb;margin-top:24px;">If you didn't create this account, you can safely ignore this email.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;">
      <p style="font-size:11px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">© 2026 BaltiCo — Defining the Culture.</p>
    </div>
  </div>
`;

export const welcomeEmail = (name) => `
  <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#fff;">
    <h1 style="font-size:32px;font-weight:300;letter-spacing:4px;margin-bottom:4px;">BaltiCo</h1>
    <p style="font-size:10px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:32px;">Welcome</p>
    <p style="font-size:15px;line-height:1.8;color:#333;">Hi <strong>${name}</strong>,</p>
    <p style="font-size:15px;line-height:1.8;color:#333;">Welcome to BaltiCo. Your account has been created successfully.</p>
    <p style="font-size:15px;line-height:1.8;color:#555;">Explore our latest collections and enjoy free shipping on orders over £200.</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;">
      <p style="font-size:11px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">© 2026 BaltiCo — Defining the Culture.</p>
    </div>
  </div>
`;

export const orderConfirmEmail = (order, user) => {
  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">${i.title} (${i.size})</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">£${(i.price * i.qty).toLocaleString("en-GB")}</td>
    </tr>`
  ).join("");

  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#fff;">
      <h1 style="font-size:32px;font-weight:300;letter-spacing:4px;margin-bottom:4px;">BaltiCo</h1>
      <p style="font-size:10px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:32px;">Order Confirmed</p>
      <p style="font-size:15px;color:#333;">Hi <strong>${user.name}</strong>, your order has been placed!</p>
      <p style="font-size:13px;color:#777;letter-spacing:2px;margin:16px 0;">ORDER: <strong style="color:#0a0a0a;">${order.orderId}</strong></p>
      <table style="width:100%;border-collapse:collapse;margin:24px 0;">
        <thead>
          <tr style="border-bottom:2px solid #0a0a0a;">
            <th style="padding:8px 0;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Item</th>
            <th style="padding:8px 0;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 0;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Total</td>
            <td style="padding:14px 0;font-size:16px;font-weight:700;text-align:right;">£${order.total.toLocaleString("en-GB")}</td>
          </tr>
        </tfoot>
      </table>
      <p style="font-size:13px;color:#555;"><strong>Delivery address:</strong> ${order.addr}</p>
      <p style="font-size:13px;color:#555;"><strong>Payment:</strong> Cash on Delivery</p>
      <p style="font-size:13px;color:#555;margin-top:16px;">Estimated delivery: 3–5 business days.</p>
      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;">
        <p style="font-size:11px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">© 2026 BaltiCo — Defining the Culture.</p>
      </div>
    </div>
  `;
};

export const orderStatusEmail = (order, user) => `
  <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#fff;">
    <h1 style="font-size:32px;font-weight:300;letter-spacing:4px;margin-bottom:4px;">BaltiCo</h1>
    <p style="font-size:10px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:32px;">Order Update</p>
    <p style="font-size:15px;color:#333;">Hi <strong>${user.name}</strong>,</p>
    <p style="font-size:15px;color:#333;">Your order <strong>${order.orderId}</strong> status has been updated to:</p>
    <p style="font-size:22px;font-weight:700;letter-spacing:3px;text-transform:uppercase;margin:24px 0;color:#0a0a0a;">${order.status}</p>
    <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;">
      <p style="font-size:11px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">© 2026 BaltiCo — Defining the Culture.</p>
    </div>
  </div>
`;

export const adminOrderEmail = (order, user) => {
  const itemsHtml = order.items.map(i =>
    `<tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">${i.title} <span style="color:#999;">(${i.size})</span></td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:center;">${i.qty}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;font-size:13px;text-align:right;">£${(i.price * i.qty).toLocaleString("en-GB")}</td>
    </tr>`
  ).join("");

  return `
    <div style="font-family:'Helvetica Neue',sans-serif;max-width:600px;margin:0 auto;padding:40px 24px;background:#fff;">
      <h1 style="font-size:32px;font-weight:300;letter-spacing:4px;margin-bottom:4px;">BaltiCo</h1>
      <p style="font-size:10px;letter-spacing:3px;color:#999;text-transform:uppercase;margin-bottom:32px;">New Order Received</p>

      <!-- Order ID banner -->
      <div style="background:#0a0a0a;color:#fff;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#aaa;">Order ID</p>
        <p style="margin:4px 0 0;font-size:22px;font-weight:700;letter-spacing:3px;">${order.orderId}</p>
      </div>

      <!-- Customer details -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:#f9f9f9;padding:16px;">
        <tr><td colspan="2" style="padding:12px 16px 4px;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#999;font-weight:700;">Customer Details</td></tr>
        <tr>
          <td style="padding:6px 16px;font-size:12px;color:#555;width:120px;">Name</td>
          <td style="padding:6px 16px;font-size:13px;font-weight:600;color:#0a0a0a;">${user.name || "—"}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px;font-size:12px;color:#555;">Email</td>
          <td style="padding:6px 16px;font-size:13px;color:#0a0a0a;">${user.email}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px;font-size:12px;color:#555;">Phone</td>
          <td style="padding:6px 16px;font-size:13px;color:#0a0a0a;">${order.phone || user.phone || "—"}</td>
        </tr>
        <tr>
          <td style="padding:6px 16px 12px;font-size:12px;color:#555;">Delivery</td>
          <td style="padding:6px 16px 12px;font-size:13px;color:#0a0a0a;">${order.addr}</td>
        </tr>
      </table>

      <!-- Items -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="border-bottom:2px solid #0a0a0a;">
            <th style="padding:8px 0;text-align:left;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Item</th>
            <th style="padding:8px 0;text-align:center;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Qty</th>
            <th style="padding:8px 0;text-align:right;font-size:10px;letter-spacing:2px;text-transform:uppercase;">Price</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding:14px 0;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Total</td>
            <td style="padding:14px 0;font-size:18px;font-weight:700;text-align:right;">£${order.total.toLocaleString("en-GB")}</td>
          </tr>
        </tfoot>
      </table>

      <p style="font-size:12px;color:#999;">Payment: Cash on Delivery &nbsp;·&nbsp; ${new Date().toLocaleString("en-GB")}</p>

      <div style="margin-top:32px;padding-top:24px;border-top:1px solid #e5e5e5;">
        <p style="font-size:11px;color:#aaa;letter-spacing:2px;text-transform:uppercase;">© 2026 BaltiCo Admin Notification</p>
      </div>
    </div>
  `;
};
