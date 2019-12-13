import * as d3 from 'd3'
import * as topojson from 'topojson'
import d3Tip from 'd3-tip'

d3.tip = d3Tip

const margin = { top: 0, left: 0, right: 0, bottom: 0 }
const height = 600 - margin.top - margin.bottom
const width = 700 - margin.left - margin.right

const svg = d3
  .select('#chart-1')
  .append('svg')
  .attr('height', height + margin.top + margin.bottom)
  .attr('width', width + margin.left + margin.right)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')

const projection = d3.geoAlbersUsa()
const path = d3.geoPath().projection(projection)

const colorScale = d3
  .scaleOrdinal()
  .domain(['Positive', 'Negative', 'Neutral'])
  .range(['pink', 'turquoise', 'white'])

const tip = d3
  .tip()
  .attr('class', 'd3-tip d3-tip-scrolly')
  .offset([-10, 0])
  .html(function (d) {
    return `${d.city}, ${d.state_id}
    <p>${d.Date}</p>
    <p>Net approval: ${d.Level}</p>
    `
  })
console.log(tip)

svg.call(tip)

let toolTipElement = d3.select(".d3-tip-scrolly").remove()

d3.select(".scrollytelling").append(d => toolTipElement.node())

Promise.all([
  d3.json(require('/data/us_states.json')),
  d3.csv(require('/data/RallyLocations.csv'))
])
  .then(ready)
  .catch(err => console.log('Failed on', err))

d3.selectAll('.label_pos').style('background', 'pink')

d3.selectAll('.label_neg').style('background', 'turquoise')

function ready([json, datapoints]) {
  console.log(json.objects)
  const states = topojson.feature(json, json.objects.us_states)
  projection.fitSize([width, height], states)

  const visited = [
    'FL',
    'PA',
    'OH',
    'WV',
    'IN',
    'MS',
    'MT',
    'TN',
    'LA',
    'NV',
    'NC',
    'KY',
    'MN',
    'TX',
    'MO',
    'IA',
    'MI',
    'WI',
    'AZ',
    'NH',
    'AL',
    'NM',
    'SC',
    'ND',
    'IL',
    'GA',
    'KS'
  ]

  svg
    .selectAll('.state')
    .data(states.features)
    .enter()
    .append('path')
    .attr('class', 'state')
    .attr('d', path)
    .attr('fill', function (d) {
      if (visited.indexOf(d.properties.postal) !== -1) {
        return '#808080'
      } else {
        return '#BEBEBE'
      }
    })

  svg
    .selectAll('.state-label')
    .data(states.features)
    .enter()
    .append('text')
    .attr('class', 'state-label')
    .text(d => d.properties.postal)
    .attr('transform', d => `translate(${path.centroid(d)})`)
    .attr('text-anchor', 'middle')
    .style('font-size', 10)
    .style('fill', 'white')

  svg
    .selectAll('.rallies')
    .data(datapoints)
    .enter()
    .append('circle')
    .attr('class', 'rallies')
    .attr('r', 4)
    .attr('transform', d => {
      const coords = projection([d.lng, d.lat])
      return `translate(${coords})`
    })
    .style('fill', 'black')
    .on('mouseover', function (d) {
      tip.show.call(this, d)
      console.log(d3.event)
      d3.select('.d3-tip-scrolly').style('top', d3.event.pageY + 10 + 'px')
    })
    .on('mouseout', tip.hide)

  d3.select('#reset-step').on('stepin', () => {
    console.log('reset')
    svg.selectAll('.rallies').style('fill', 'black')
  })

  d3.select('#pop-step').on('stepin', function() {
    console.log('popularity is here')
    svg
      .selectAll('.rallies')
      .style('fill', d => colorScale(d.Rating))
      .raise()
  })

  function render() {
    const svgContainer = svg.node().closest('div')
    const svgWidth = svgContainer.offsetWidth
    // Do you want it to be full height? Pick one of the two below
    const svgHeight = height + margin.top + margin.bottom
    // const svgHeight = window.innerHeight

    const actualSvg = d3.select(svg.node().closest('svg'))
    actualSvg.attr('width', svgWidth).attr('height', svgHeight)

    const newWidth = svgWidth - margin.left - margin.right
    const newHeight = svgHeight - margin.top - margin.bottom

    // // Update our scale
    // xPositionScale.range([0, newWidth])
    // yPositionScale.range([newHeight, 0])

    // // Update things you draw
    projection.fitSize([newWidth, newHeight], states)
    svg.selectAll('path').attr('d', path)

    svg.selectAll('.rallies').attr('transform', d => {
      const coords = projection([d.lng, d.lat])
      return `translate(${coords})`
    })

    svg
      .selectAll('.state-label')
      .attr('transform', d => `translate(${path.centroid(d)})`)

    // // Update axes
    // // svg.select('.x-axis').call(xAxis)

    // svg.selectAll('.gdp-note-high').attr('x', newWidth * 0.75)
    // svg.selectAll('.gdp-note-low').attr('x', newWidth * 0.25)

    // svg.select('.y-axis').call(yAxis)
    // svg.select('.y-axis .domain').remove()
  }

  // When the window resizes, run the function
  // that redraws everything
  window.addEventListener('resize', render)

  // And now that the page has loaded, let's just try
  // to do it once before the page has resized
  render()
}
