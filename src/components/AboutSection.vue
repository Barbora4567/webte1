<template>
  <section class="card shadow-sm border-0 mb-4">
    <div class="card-header bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
      <h2 class="h5 mb-0 fw-bold text-primary">
        <i class="bi bi-info-circle me-2"></i>O projekte
      </h2>
    </div>
    <div class="card-body">
      <p class="mb-3">
        <strong>Môj TODO List</strong> je moderná webová aplikácia určená na správu a časové plánovanie osobných úloh. 
        Umožňuje vytvárať, upravovať, filtrovať a odstraňovať úlohy, pričom všetky zmeny sa v reálnom čase 
        synchronizujú s externým REST API serverom.
      </p>

      <h3 class="h6 fw-bold mb-2">Použité technológie a knižnice:</h3>
      <ul class="list-group list-group-flush mb-3">
        <li class="list-group-item px-0">
          <strong>Frontend framework:</strong> Vue 3 (Composition API, <code>&lt;script setup&gt;</code>) + Vite
        </li>
        <li class="list-group-item px-0">
          <strong>Kalendárová knižnica:</strong> FullCalendar v6 (mesačný, týždenný a denný pohľad, interaktívny výber termínov)
        </li>
        <li class="list-group-item px-0">
          <strong>Komunikácia s API:</strong> Axios (asynchrónne HTTP požiadavky GET, POST, PUT, PATCH, DELETE na <code>wt1zadanie.iolab.sk</code>)
        </li>
        <li class="list-group-item px-0">
          <strong>Dizajn a responzivita:</strong> Bootstrap 5 a Bootstrap Icons
        </li>
      </ul>

      <p class="text-muted small mb-0">
        Zoznam úloh a kalendár zdieľajú jednotný reaktívny stav – každá úprava vykonaná v zozname sa okamžite 
        prejaví v kalendári a naopak.
      </p>
    </div>
  </section>
</template>