// .pnpmfile.cjs - helps with dependency resolution on older pnpm versions

function readPackage(pkg, context) {
  // Fix peer dependency issues for Vercel's older pnpm
  if (pkg.name === "@aptos-labs/wallet-adapter-core") {
    // Allow any version of @aptos-labs/ts-sdk
    if (pkg.peerDependencies && pkg.peerDependencies["@aptos-labs/ts-sdk"]) {
      pkg.peerDependencies["@aptos-labs/ts-sdk"] = "*";
    }
  }

  return pkg;
}

module.exports = {
  hooks: {
    readPackage,
  },
};
