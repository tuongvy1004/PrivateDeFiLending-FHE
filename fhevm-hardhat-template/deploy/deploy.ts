import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedPrivateDeFiLending = await deploy("PrivateDeFiLending", {
    from: deployer,
    log: true,
  });
  

  console.log(`PrivateDeFiLending contract: `, deployedPrivateDeFiLending.address);
 
};
export default func;
func.id = "deploy"; // id required to prevent reexecution
func.tags = ["PrivateDeFiLending"];
