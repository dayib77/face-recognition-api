const router = (databases, bcrypt) => async (req, res) => {
  const { name, email, password } = req.body; // get user details from request body

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Use transaction to ensure both inserts succeed or fail together
    const result = await databases.transaction(async trx => {
      const [user] = await trx("users")
        .insert({
          full_name: name,
          email,
        })
        .returning("*");

      await trx("login").insert({
        user_id: user.id,
        password_hash: hashedPassword,
      });

      return user;
    });

    res.status(201).json({ newUser: result });
  } catch (error) {
    console.error("Register transaction failed:", error);
    res.status(500).json({ message: "Unable to register user" });
  }
};

export default router;
