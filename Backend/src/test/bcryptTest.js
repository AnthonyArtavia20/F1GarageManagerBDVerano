const bcrypt = require('bcryptjs');

async function test() {
  const password = "MiContraseñaSegura123*";

  // Generar salt
  const salt = await bcrypt.genSalt(10);

  // Hash
  const hash = await bcrypt.hash(password, salt);

  console.log("Salt generado:", salt);
  console.log("Hash generado:", hash);

  // Comparar
  const isMatch = await bcrypt.compare(password, hash);
  console.log("¿Coincide con la contraseña original?:", isMatch);
}

test();
