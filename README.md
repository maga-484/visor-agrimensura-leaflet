# 🧭 Visor del Agrimensor | Surveyor's Viewer | 测量员视图

> Una herramienta web interactiva para delimitar parcelas, calcular perímetros, superficies y exportar datos catastrales — directamente desde el navegador.

> An interactive web tool for parcel delimitation, perimeter & area calculation, and cadastral data export — right from the browser.

> 一款交互式网页工具，用于地块划定、周长与面积计算，以及地籍数据导出——直接在浏览器中完成。

---

## 🚀 Demo en vivo | Live Demo | 在线演示

🔗 [https://maga-484.github.io/visor-agrimensura-leaflet](https://TU-USUARIO.github.io/visor-agrimensura-leaflet)


---

## ✨ Funcionalidades | Features | 功能

| Español | English | 中文 |
|---|---|---|
| Dibujar polígonos con clic en el mapa | Draw polygons by clicking on the map | 点击地图绘制多边形 |
| Doble clic para cerrar el polígono | Double-click to close the polygon | 双击闭合多边形 |
| Cálculo de perímetro en metros | Perimeter calculation in meters | 周长计算（米） |
| Cálculo de superficie en m² y hectáreas | Area calculation in m² and hectares | 面积计算（平方米/公顷） |
| Tabla de vértices con rumbos agrimensores | Vertex table with surveyor bearings | 顶点表（含方位角） |
| Editar vértices arrastrando | Edit vertices by dragging | 拖拽编辑顶点 |
| Capa base satelital (Esri) | Satellite base layer (Esri) | 卫星底图（Esri） |
| Geolocalización del usuario | User geolocation | 用户定位 |
| Exportar a CSV | Export to CSV | 导出 CSV |

---

## 🛠️ Tecnologías | Tech Stack | 技术栈

- **Leaflet.js** — Mapas interactivos / Interactive maps / 交互式地图
- **OpenStreetMap & Esri World Imagery** — Capas base / Base layers / 底图
- **Vanilla JavaScript (ES6+)** — Lógica pura, sin frameworks / Pure logic, no frameworks / 纯原生逻辑
- **HTML5 + CSS3** — Interfaz responsive / Responsive UI / 响应式界面

---

## 📦 Instalación local | Local Setup | 本地运行

```bash
git clone https://github.com/maga-484/visor-agrimensura-leaflet.git
cd visor-agrimensura-leaflet
# Abrí index.html en tu navegador
# Open index.html in your browser
# 在浏览器中打开 index.html
No requiere servidor ni dependencias. Es 100% frontend.
No server or dependencies required. 100% frontend.
无需服务器或依赖。纯前端项目。
📐 Fórmulas utilizadas | Formulas Used | 使用的公式
Perímetro: Suma de distancias geodésicas distanceTo() de Leaflet (fórmula de Haversine)
Área: Fórmula de Gauss (shoelace) sobre coordenadas proyectadas localmente
Rumbos: Azimuth geodésico → conversión a formato agrimensor (N/S + ángulo + E/W)
🗺️ Hoja de ruta | Roadmap | 路线图
[x] Dibujar polígonos y calcular perímetro/área
[x] Tabla de vértices con rumbos
[x] Exportar CSV
[x] Capa satelital y geolocalización
[ ] Persistencia en localStorage
[ ] Múltiples parcelas simultáneas
[ ] Importar coordenadas desde CSV
[ ] Proyección UTM exacta para precisión catastral
📄 Licencia | License | 许可证
MIT © 2026 — maga-484 / maga-484 / 你的名字