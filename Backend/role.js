const roleUpdate = async () => {
  try {
    await updateMany({ role: "user" }, { $set: { role: "USER" } });
    await updateMany({ role: "admin" }, { $set: { role: "ADMIN" } });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
