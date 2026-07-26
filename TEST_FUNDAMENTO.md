# Fundamento de los Tests UTM

## ¿Por qué existe este test?

El archivo `test-utm.html` no es un test unitario convencional. Es un **test de
regresión de precisión catastral** que valida que la función
`calcularAreaUTM()` del módulo `js/utm.js` cumple con la **norma de la
Provincia de Buenos Aires**, que exige una tolerancia máxima del **5%** en el
cálculo de superficies.

Sin este test, cualquier refactor de la proyección UTM (cambio de fórmula,
actualización de constantes del elipsoide, optimización de código) podría
introducir errores que pasen desapercibidos en el frontend pero invaliden
resultados catastrales en el campo.

---

## ¿Qué valida exactamente?

1. **Proyección UTM completa (Redfearn/Thomas)** con elipsoide WGS84.
2. **Precisión en 5 escalas de trabajo reales** del agrimensor:
   - Lote urbano pequeño (450 m²)
   - Manzana urbana (1 ha)
   - Campo rural chico (1 ha)
   - Campo rural mediano (10 ha)
   - Polígono irregular (triángulo, 2.500 m²)
3. **Tolerancia del 5%** en todos los casos.

---

## ¿Cómo se calculan las coordenadas de prueba?

Las coordenadas no se inventan. Se derivan de **distancias reales en metros**
convertidas a grados decimales mediante las fórmulas del elipsoide WGS84:

```
Δlat (°) = distancia_sur (m) / 111.132
Δlng (°) = distancia_este (m) / (111.320 × cos φ)
```

Donde:
- **111.132 m/°** es la longitud de 1° de latitud en el meridiano (constante).
- **111.320 × cos φ** es la longitud de 1° de longitud a la latitud φ (varía
  con la latitud porque los meridianos convergen hacia los polos).
- **φ** es la latitud del lugar de prueba.

### Ejemplo concreto: Lote urbano 15 m × 30 m en Buenos Aires

Latitud φ = -34.6037°

```
cos(-34.6037°) = 0.8235
1° lng = 111.320 × 0.8235 ≈ 91.600 m

Δlng = 15 m / 91.600 m/° ≈ 0.0001637°
Δlat = 30 m / 111.132 m/° ≈ 0.0002699°

P1: (-34.603700, -58.381600)
P2: (-34.603700, -58.381600 + 0.0001637) = (-34.603700, -58.381436)
P3: (-34.603700 - 0.0002699, -58.381436) = (-34.603970, -58.381436)
P4: (-34.603970, -58.381600)
```

Esto garantiza que, antes de aplicar la proyección UTM, el polígono tiene una
superficie planimétrica conocida de **450 m² exactos**. Cualquier desviación
respecto a ese valor al ejecutar `calcularAreaUTM()` es atribuible únicamente
a la precisión del algoritmo de proyección.

---

## ¿Por qué estas 5 parcelas?

| Parcela | Superficie | Geometría | Escenario real |
|---------|-----------|-----------|----------------|
| Lote urbano | 450 m² | Rectángulo 15×30 m | Subdivisión en ciudad |
| Manzana | 10.000 m² | Cuadrado 100×100 m | Catastro urbano |
| Campo 1 ha | 10.000 m² | Cuadrado ~100×100 m | Estancia rural chica |
| Campo 10 ha | 100.000 m² | Rectángulo 100×1.000 m | Campo agrícola |
| Triángulo | 2.500 m² | 3 vértices, irregular | Linderos reales |

La variedad cubre:
- **Escalas**: desde 450 m² hasta 10 ha (factor 200×).
- **Formas**: rectángulos y triángulo irregular.
- **Latitudes**: Buenos Aires (-34.6°) y zona rural pampeana (-36.5°), donde
  la deformación de la proyección UTM difiere.

---

## Ejecución

### Manual (navegador)
```bash
npx serve . -l 3000
# Abrir http://localhost:3000/test-utm.html
```

### Automatizada (CI con Playwright)
```bash
node scripts/run-tests.mjs
```

El script de CI abre la página en Chromium headless, evalúa los elementos
`.pass` / `.fail` del DOM y falla si algún test excede el 5%.

---

## Historial de correcciones

- **v3.3.1**: Corrección de coordenadas en Test 1 (lote urbano) y Test 4
  (campo 10 ha). Las coordenadas originales usaban aproximaciones manuales
  imprecisas que generaban errores del 17.5% y 911% respectivamente,
  invalidando el propósito del test. Se reemplazaron por coordenadas
  calculadas analíticamente desde distancias en metros.
