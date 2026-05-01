import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

const titleElement = document.querySelector('.projects-title');
if (titleElement) {
  titleElement.textContent = `Projects (${projects.length})`;
}

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
let colors = d3.scaleOrdinal(d3.schemeTableau10);
let selectedIndex = -1;
let query = '';

function renderPieChart(projectsGiven) {
  let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  let newData = newRolledData.map(([year, count]) => {
    return { value: count, label: year };
  });

  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));

  // Clear existing paths and legend
  let svg = d3.select('svg');
  svg.selectAll('path').remove();
  d3.select('.legend').selectAll('li').remove();

  // Draw new paths
  newArcs.forEach((arc, idx) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx))
      .attr('class', idx === selectedIndex ? 'selected' : '')
      .on('click', () => {
        selectedIndex = selectedIndex === idx ? -1 : idx;

        svg
          .selectAll('path')
          .attr('class', (_, i) => i === selectedIndex ? 'selected' : '');

        d3.select('.legend')
          .selectAll('li')
          .attr('class', (_, i) =>
            i === selectedIndex ? 'legend-item selected' : 'legend-item'
          );

        if (selectedIndex === -1) {
          let filteredBySearch = projects.filter((project) => {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
          });
          renderProjects(filteredBySearch, projectsContainer, 'h2');
        } else {
          let selectedYear = newData[selectedIndex].label;
          let filteredProjects = projects.filter((project) => {
            let matchesYear = project.year === selectedYear;
            let values = Object.values(project).join('\n').toLowerCase();
            let matchesQuery = values.includes(query.toLowerCase());
            return matchesYear && matchesQuery;
          });
          renderProjects(filteredProjects, projectsContainer, 'h2');
        }
      });
  });

  // Draw new legend
  let legend = d3.select('.legend');
  newData.forEach((d, idx) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(idx)}`)
      .attr('class', idx === selectedIndex ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
  });
}

// Render on page load
renderProjects(projects, projectsContainer, 'h2');
renderPieChart(projects);

// Search functionality
let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
  query = event.target.value;

  let filteredProjects = projects.filter((project) => {
    let values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  selectedIndex = -1;
  renderProjects(filteredProjects, projectsContainer, 'h2');
  renderPieChart(filteredProjects);
});