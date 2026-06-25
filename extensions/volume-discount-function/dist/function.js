// node_modules/javy/dist/index.js
var r = /* @__PURE__ */ ((t) => (t[t.Stdin = 0] = "Stdin", t[t.Stdout = 1] = "Stdout", t[t.Stderr = 2] = "Stderr", t))(r || {});

// node_modules/javy/dist/fs/index.js
function o(i) {
  let r2 = new Uint8Array(1024), e = 0;
  for (; ; ) {
    const t = Javy.IO.readSync(i, r2.subarray(e));
    if (t < 0)
      throw Error("Error while reading from file descriptor");
    if (t === 0)
      return r2.subarray(0, e + t);
    if (e += t, e === r2.length) {
      const n = new Uint8Array(r2.length * 2);
      n.set(r2), r2 = n;
    }
  }
}
function l(i, r2) {
  for (; r2.length > 0; ) {
    const e = Javy.IO.writeSync(i, r2);
    if (e < 0)
      throw Error("Error while writing to file descriptor");
    if (e === 0)
      throw Error("Could not write all contents in buffer to file descriptor");
    r2 = r2.subarray(e);
  }
}

// node_modules/@shopify/shopify_function/run.ts
function run_default(userfunction) {
  const input_data = o(r.Stdin);
  const input_str = new TextDecoder("utf-8").decode(input_data);
  const input_obj = JSON.parse(input_str);
  const output_obj = userfunction(input_obj);
  const output_str = JSON.stringify(output_obj);
  const output_data = new TextEncoder().encode(output_str);
  l(r.Stdout, output_data);
}

// extensions/volume-discount-function/src/index.js
var NO_CHANGES = {
  discounts: [],
  discountApplicationStrategy: "FIRST"
};
function run(input) {
  const lines = input.cart.lines;
  if (!lines || lines.length === 0) return NO_CHANGES;
  const discounts = [];
  const productMap = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product?.volume_tiers?.value) continue;
    const productId = product.id;
    if (!productMap.has(productId)) {
      productMap.set(productId, {
        totalQuantity: 0,
        tiers: JSON.parse(product.volume_tiers.value),
        variantId: line.merchandise.id
      });
    }
    productMap.get(productId).totalQuantity += line.quantity;
  }
  for (const [, { totalQuantity, tiers, variantId }] of productMap) {
    const applicableTier = tiers.filter((t) => totalQuantity >= t.min_quantity).sort((a, b) => b.min_quantity - a.min_quantity)[0];
    if (!applicableTier) continue;
    const value = applicableTier.discount_type === "percentage" ? { percentage: { value: applicableTier.discount_value.toString() } } : { fixedAmount: { amount: applicableTier.discount_value.toString() } };
    discounts.push({
      message: applicableTier.label || "Volume discount",
      targets: [{ productVariant: { id: variantId } }],
      value
    });
  }
  const cartProductQty = /* @__PURE__ */ new Map();
  const cartProductVariants = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product) continue;
    const pid = product.id;
    cartProductQty.set(pid, (cartProductQty.get(pid) || 0) + line.quantity);
    if (!cartProductVariants.has(pid)) cartProductVariants.set(pid, []);
    cartProductVariants.get(pid).push(line.merchandise.id);
  }
  for (const line of lines) {
    const product = line.merchandise?.product;
    if (!product?.bogo_rules?.value) continue;
    let bogoRules;
    try {
      bogoRules = JSON.parse(product.bogo_rules.value);
    } catch (e) {
      continue;
    }
    const buyQtyInCart = cartProductQty.get(product.id) || 0;
    for (const rule of bogoRules) {
      if (buyQtyInCart < rule.buy_quantity) continue;
      const getVariants = cartProductVariants.get(rule.get_product_id);
      if (!getVariants || getVariants.length === 0) continue;
      for (const variantId of getVariants) {
        discounts.push({
          message: `Buy ${rule.buy_quantity}+, get ${rule.discount_value === 100 ? "free" : `${rule.discount_value}% off`}`,
          targets: [{ productVariant: { id: variantId } }],
          value: { percentage: { value: String(rule.discount_value) } }
        });
      }
    }
  }
  if (discounts.length === 0) return NO_CHANGES;
  return {
    discounts,
    discountApplicationStrategy: "MAXIMUM"
  };
}

// <stdin>
function run2() {
  return run_default(run);
}
export {
  run2 as run
};
