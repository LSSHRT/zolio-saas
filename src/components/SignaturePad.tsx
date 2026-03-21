"use client";

import React, { forwardRef } from "react";
import SignatureCanvas from "react-signature-canvas";
import type ReactSignatureCanvas from "react-signature-canvas";

type SignaturePadProps = React.ComponentProps<typeof SignatureCanvas>;

const SignaturePad = forwardRef<ReactSignatureCanvas, SignaturePadProps>((props, ref) => {
  return <SignatureCanvas ref={ref} {...props} />;
});

SignaturePad.displayName = "SignaturePad";

export default SignaturePad;
