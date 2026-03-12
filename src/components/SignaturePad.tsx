"use client";

import React, { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";

const SignaturePad = forwardRef<any, any>((props, ref) => {
  return <SignatureCanvas ref={ref} {...props} />;
});

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
