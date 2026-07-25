readme = """# 🧭 Visor del Agrimensor | Surveyor's Viewer | 测量员视图

> Herramienta web interactiva para delimitar parcelas, calcular perímetros y superficies con proyección UTM exacta (WGS84), y exportar datos catastrales — directamente desde el navegador, sin backend.

> An interactive web tool for parcel delimitation, perimeter & area calculation with exact UTM projection (WGS84), and cadastral data export — right from the browser, no backend required.

> 一款交互式网页工具，用于地块划定、周长与面积计算（采用精确UTM投影WGS84），以及地籍数据导出——直接在浏览器中完成，无需后端。

---

## 🚀 Demo en vivo | Live Demo | 在线演示

🔗 [https://maga-484.github.io/visor-agrimensura-leaflet](https://maga-484.github.io/visor-agrimensura-leaflet)

---

## ✨ Funcionalidades | Features | 功能

| Español                                                 | English                                                   | 中文                                      |
| ------------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------- |
| Dibujar polígonos con clic en el mapa                   | Draw polygons by clicking on the map                      | 点击地图绘制多边形                        |
| Doble clic para cerrar el polígono                      | Double-click to close the polygon                         | 双击闭合多边形                            |
| Cálculo de perímetro geodésico (Haversine)              | Geodesic perimeter calculation (Haversine)                | 大地线周长计算（哈弗辛）                  |
| Cálculo de superficie con **UTM exacta (WGS84)**        | Area calculation with **exact UTM (WGS84)**               | 采用精确UTM投影（WGS84）计算面积          |
| Resultados en m² y hectáreas                            | Results in m² and hectares                                | 结果以平方米和公顷显示                    |
| **Persistencia en localStorage**                        | **localStorage persistence**                              | **localStorage本地持久化**                |
| **Múltiples parcelas** simultáneas                      | **Multiple parcels** at once                              | **同时管理多个地块**                      |
| Editar vértices arrastrando                             | Edit vertices by dragging                                 | 拖拽编辑顶点                              |
| 4 capas base: OSM, Humanitario, Voyager, Esri Satelital | 4 base layers: OSM, Humanitarian, Voyager, Esri Satellite | 4种底图：OSM、人道主义、Voyager、Esri卫星 |
| Zoom hasta nivel 20 (ideal urbano)                      | Zoom up to level 20 (ideal for urban)                     | 最大缩放至20级（适合城区）                |
| Barra de escala métrica                                 | Metric scale bar                                          | 公制比例尺                                |
| Geolocalización del usuario                             | User geolocation                                          | 用户定位                                  |
| Exportar a CSV                                          | Export to CSV                                             | 导出CSV                                   |
| **Importar 7 formatos geoespaciales**                   | **Import 7 geospatial formats**                           | **导入7种地理空间格式**                   |

---

## 🛠️ Arquitectura | Architecture | 架构

Proyecto modular en **Vanilla JavaScript ES6**, sin frameworks. Separado por responsabilidades:

```
js/
├── config.js      # Mapa, capas base, constantes
├── utm.js         # Proyección UTM exacta (WGS84)
├── parsers.js     # Importación: CSV, KML, GeoJSON, GPX, SHP, WKT, TopoJSON
├── storage.js     # Persistencia localStorage
├── parcelas.js    # Lógica de negocio de parcelas
├── ui.js          # Eventos DOM y métricas
└── app.js         # Entry point / orquestador
```

| Tecnología                                       | Uso                        | 用途            |
| ------------------------------------------------ | -------------------------- | --------------- |
| **Leaflet.js**                                   | Mapas interactivos         | 交互式地图      |
| **OpenStreetMap / HOT / CartoDB Voyager / Esri** | Capas base                 | 底图            |
| **shpjs**                                        | Parseo de Shapefile (.zip) | Shapefile解析   |
| **topojson-client**                              | Parseo de TopoJSON         | TopoJSON解析    |
| **Vanilla JS (ES6+)**                            | Lógica pura, módulos ES6   | 原生ES6模块逻辑 |
| **HTML5 + CSS3**                                 | Interfaz responsive        | 响应式界面      |

---

## 📐 Precisión validada | Validated Accuracy | 精度验证

Todos los cálculos de superficie se validan contra la **norma de la Provincia de Buenos Aires: tolerancia máxima del 5%**.

| Parcela de prueba   | Área esperada | Área calculada (UTM) | Error  | Estado           |
| ------------------- | ------------- | -------------------- | ------ | ---------------- |
| Lote urbano 15×30 m | 450 m²        | ~450 m²              | < 0.1% | ✅ Dentro del 5% |
| Manzana 100×100 m   | 10.000 m²     | ~10.070 m²           | ~0.7%  | ✅ Dentro del 5% |
| Campo rural 1 ha    | 10.000 m²     | ~10.000 m²           | < 0.1% | ✅ Dentro del 5% |
| Campo rural 10 ha   | 100.000 m²    | ~100.000 m²          | < 0.1% | ✅ Dentro del 5% |
| Triángulo irregular | 2.500 m²      | ~2.500 m²            | < 0.5% | ✅ Dentro del 5% |

> **Fórmula utilizada:** Proyección UTM completa (Redfearn/Thomas) con elipsoide WGS84. No usa aproximaciones planas que fallan en grandes extensiones.

> **Formula used:** Full UTM projection (Redfearn/Thomas) with WGS84 ellipsoid. No flat approximations that fail at large extents.

---

## 📦 Instalación local | Local Setup | 本地运行

```bash
git clone https://github.com/maga-484/visor-agrimensura-leaflet.git
cd visor-agrimensura-leaflet

# Opción A: Servidor local (recomendado para módulos ES6)
npx serve .

# Opción B: Abrir index.html directamente en navegador
# (algunos navegadores requieren servidor para módulos ES6)
```

No requiere build ni dependencias de Node. Las librerías externas se cargan vía CDN.

No server build or Node dependencies required. External libraries loaded via CDN.

无需构建或Node依赖。外部库通过CDN加载。

---

## 🧪 Tests

Abrir `test-utm.html` en el navegador para ejecutar la suite de validación de precisión UTM contra la norma del 5%.

```bash
# Si usás serve:
http://localhost:3000/test-utm.html
```

---

## 📥 Formatos de importación | Import Formats | 导入格式

| Formato  | Extensión           | Notas                                    |
| -------- | ------------------- | ---------------------------------------- |
| CSV      | `.csv`              | Últimas 2 columnas: Latitud, Longitud    |
| KML      | `.kml`              | Extrae coordenadas de `<coordinates>`    |
| GeoJSON  | `.json`, `.geojson` | Polygon, MultiPolygon, LineString, Point |
| GPX      | `.gpx`              | Track points, waypoints, route points    |
| SHP      | `.zip`              | Shapefile comprimido (usa shpjs)         |
| WKT      | `.wkt`, `.txt`      | POLYGON, MULTIPOLYGON, LINESTRING        |
| TopoJSON | `.json`             | Conversión automática a GeoJSON          |

---

## 🗺️ Hoja de ruta | Roadmap | 路线图

- [x] Dibujar polígonos y calcular perímetro/área
- [x] Proyección UTM exacta (WGS84)
- [x] Tests de precisión con norma del 5%
- [x] Arquitectura modular ES6
- [x] Tabla de vértices con rumbos (v2)
- [x] Exportar CSV
- [x] Capas base múltiples + zoom urbano
- [x] Geolocalización
- [x] Persistencia en `localStorage`
- [x] Múltiples parcelas simultáneas
- [x] Importar 7 formatos geoespaciales
- [ ] Backend Node.js + PostGIS para persistencia colaborativa
- [ ] Autenticación de usuarios
- [ ] Compartir parcelas por URL

---

## 📄 Licencia | License | 许可证

MIT © 2026 — [maga-484](https://github.com/maga-484)

---

> _"No hice un CRUD genérico. Hice una herramienta que resuelve un problema que viví como agrimensor: calcular superficies con precisión catastral en el campo, sin software propietario."_
>
> _"I didn't build a generic CRUD. I built a tool that solves a problem I experienced as a surveyor: calculating areas with cadastral precision in the field, without proprietary software."_
>
> _"我没有做一个通用的CRUD。我做了一个解决我作为测量员在实际工作中遇到的问题的工具：在野外以地籍精度计算面积，无需专有软件。"_
> """

with open('/mnt/agents/output/README.md', 'w', encoding='utf-8') as f:
f.write(readme)

print("README.md generado correctamente.")
