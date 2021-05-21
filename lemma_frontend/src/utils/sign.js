import { ethers } from "ethers";
import abiDecoder from "abi-decoder";
import AmbHelper from "../abis/AMB.json";

export const getSignatures = async (txHash) => {
  try {
    const userEvent = [
      {
        type: "event",
        name: "UserRequestForSignature",
        inputs: [
          { type: "bytes32", name: "messageId", indexed: true },
          { type: "bytes", name: "encodedData", indexed: false },
        ],
        anonymous: false,
      },
    ];

    abiDecoder.addABI(userEvent);
    let signatures = new Array();
    const amb_helper_xdai_address =
      "0x7d94ece17e81355326e3359115D4B02411825EdD";
    const provider = ethers.getDefaultProvider(
      "https://rough-frosty-dream.xdai.quiknode.pro/40ffd401477e07ef089743fe2db6f9f463e1e726/"
    );
    const tx = await provider.getTransactionReceipt(txHash);
    const logPromise = await provider.getLogs(tx);

    let decodedLogs = abiDecoder.decodeLogs(
      logPromise.filter(
        (log) =>
          log.topics[0].toLowerCase() ===
          "0x520d2afde79cbd5db58755ac9480f81bc658e5c517fcae7365a3d832590b0183"
      )
    );
    const ambHelperContract = new ethers.Contract(
      amb_helper_xdai_address,
      AmbHelper,
      provider
    );

    for (let i = 0; i < decodedLogs.length; i++) {
      let decodedLog = decodedLogs[i];
      let encodedData = decodedLog.events[1].value;
      let messageId = decodedLog.events[0].value;
      console.log(encodedData);
      console.log(ethers.utils.arrayify(encodedData));

      let signature = await ambHelperContract.getSignatures(
        ethers.utils.arrayify(encodedData)
      );
      console.log(signature);
      signatures.push({
        messageId: messageId,
        encodedData: encodedData,
        signature: signature,
      });
    }
    console.log(signatures);

    return signatures;
  } catch (e) {
    console.log(e);
  }
};
