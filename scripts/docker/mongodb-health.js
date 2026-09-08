try {
  const status = db.adminCommand({ replSetGetStatus: 1 });
  if (!status.ok) quit(2);
} catch (error) {
  if (error.code !== 94) throw error;
  rs.initiate({ _id: "rs0", members: [{ _id: 0, host: "mongodb:27017" }] });
}
quit(db.adminCommand({ hello: 1 }).isWritablePrimary ? 0 : 2);
