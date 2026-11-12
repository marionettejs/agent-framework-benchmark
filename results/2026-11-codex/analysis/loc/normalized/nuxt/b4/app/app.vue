<template>
  <header>
    <div class="header-inner">
      <NuxtLink class="brand" to="/">Pokédex</NuxtLink>
      <nav>
        <NuxtLink to="/">Pokémon</NuxtLink
        ><NuxtLink to="/types">Types</NuxtLink>
      </nav>
    </div>
  </header>
  <NuxtPage />
  <footer>
    Data from PokéAPI. Pokémon and Pokémon character names are trademarks of
    Nintendo.
  </footer>
</template>
