function graphChart() {
  var width = window.innerWidth,
    height = window.innerWidth,
    fillNode = "#07a0c3",
    strokeNode = "#fff",
    fillNodeHover = "#E47F74",
    fillNeighbors = "#f0c808",
    fillText = "#333",
    strokeLink = d3.rgb(150, 150, 150, 0.6),
    strokeLinkHover = d3.rgb(50, 50, 50, 1),
    minRadius = 20,
    maxRadius = 70,
    radius = function(node) {
      result = parseInt(node.amount / 13000);
      if (result > maxRadius) return maxRadius;
      else if (result < minRadius) return minRadius;
      return result;
      // if (result > maxRadius) return 20
      // else if (result < minRadius) return 20
      // return 20
    };

  function chart(selection) {
    selection.each(function(data) {
      var zoom = d3
        .zoom()
        .scaleExtent([1 / 4, 5])
        .on("zoom", zoomed);

      var svg = d3
        .select(this)
        .attr("width", width)
        .attr("height", height)
        .call(zoom);

      // svg
      //   .append("svg:defs")
      //   .selectAll("marker")
      //   .data(["end"]) // Different link/path types can be defined here
      //   .enter()
      //   .append("svg:marker") // This section adds in the arrows
      //   .attr("id", String)
      //   .attr("viewBox", "0 -5 10 10")
      //   .attr("refX", 30)
      //   .attr("refY", 0)
      //   .attr("markerWidth", 6)
      //   .attr("markerHeight", 6)
      //   .attr("orient", "auto")
      //   .append("svg:path")
      //   .attr("d", "M0,-5L10,0L0,5");

      const simulation = d3
        .forceSimulation(data.nodes)
        .force(
          "link",
          d3
            .forceLink(data.edges)
            .id(d => d.id)
            .distance(180)
        )
        .force("charge", d3.forceManyBody().strength(d => -radius(d) * 100))
        .force("center", d3.forceCenter(width / 3, height / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY());

      function zoomed() {
        let scale = d3.event.transform.k;
        g.attr(
          "transform",
          `translate(${d3.event.transform.x}, ${
            d3.event.transform.y
          }) scale(${scale})`
        );
      }

      const dragNode = function(simulation) {
        function dragstarted(d) {
          if (!d3.event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        }

        function dragged(d) {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        }

        function dragended(d) {
          if (!d3.event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }

        return d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      };

      const getNeighbors = function(node) {
        var id = d3.select(node).attr("id");
        var neighbors = data.edges.filter(
          link => link.source.id === id || link.target.id === id
        );

        const neighbors_nodes = neighbors.map(function(link) {
          if (link.source.id === id) {
            return "#" + link.target.id;
          } else {
            return "#" + link.source.id;
          }
        });

        var neighbors_edges = neighbors.map(d => "#link_" + d.index).join(",");

        return {
          nodes: neighbors_nodes.join(),
          links: neighbors_edges
        };
      };

      const handleMouseOver = function(d, i) {
        var neighbors = getNeighbors(this);

        d3.select(this)
          .transition()
          .select("circle")
          .attr("class", d => "node " + d.type + " active");
        // .attr('fill', fillNodeHover)

        d3.select(this)
          .transition()
          .select("text")
          .attr("fill-opacity", 1);

        d3.selectAll(neighbors.nodes)
          .select("circle")
          .transition()
          .attr("class", d => "node " + d.type + " neighbor");
        // .attr('fill', fillNeighbors)

        d3.selectAll(neighbors.nodes)
          .select("text")
          .transition()
          .attr("fill-opacity", 1);

        d3.selectAll(neighbors.links)
          .transition()
          .attr("stroke", strokeLinkHover);
      };

      const handleMouseOut = function(d, i) {
        var neighbors = getNeighbors(this);
        d3.select(this)
          .select("circle")
          .transition()
          .attr("class", d => "node " + d.type);
        // .attr('fill', fillNode)

        d3.selectAll(".nodes text")
          .filter((d, i) => d.amount < 500000)
          .transition()
          .attr("fill-opacity", 0);

        d3.selectAll(neighbors.nodes)
          .select("circle")
          .transition()
          .attr("class", d => "node " + d.type);
        // .attr('fill', fillNode)

        d3.selectAll(neighbors.links)
          .transition()
          .attr("stroke", strokeLink);
      };

      var g = svg.append("g").attr("id", "force-directed-graph");

      svg.call(
        zoom.transform,
        d3.zoomIdentity.scale(0.6).translate(width / 2, height / 2)
      );

      var links = g
        .append("g")
        .attr("class", "links")
        .attr("stroke", strokeLink)
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(data.edges)
        .enter()
        .append("line")
        .attr("stroke-width", 2)
        .attr("id", (d, i) => "link_" + i);
      // .attr("marker-end", "url(#end)");

      var nodes = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("circle")
        .data(data.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("id", d => d.id)
        .on("mouseover", handleMouseOver)
        .on("mouseout", handleMouseOut)
        .on("click", handleMouseOver)
        .call(dragNode(simulation));

      nodes
        .append("circle")
        .attr("r", d => radius(d))
        // .attr("fill", fillNode)
        .attr("stroke", strokeNode)
        .attr("stroke-width", 3)
        .attr("class", d => "node " + d.type);

      nodes
        .append("text")
        .text(d => d.label)
        .attr("fill", fillText)
        .attr("fill-opacity", 1)
        .attr("font-size", 20)
        .attr("font-weight", "bold")
        .attr("text-anchor", "middle")
        .filter((d, i) => d.amount < 500000)
        .attr("fill-opacity", 0);

      nodes.append("title").text(d => d.info);

      simulation.on("tick", () => {
        graph_data.nodes[0].fx = width / 3;
        graph_data.nodes[0].fy = height / 3;

        links
          .attr("x1", d => d.source.x)
          .attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x)
          .attr("y2", d => d.target.y);

        nodes
          .selectAll("circle")
          .attr("cx", d => d.x)
          .attr("cy", d => d.y);

        nodes
          .selectAll("text")
          .attr("x", d => d.x)
          .attr("y", d => d.y + radius(d) / 4);
      });
    });
  }

  chart.width = function(value) {
    if (!arguments.length) return width;
    width = value;
    return chart;
  };

  chart.height = function(value) {
    if (!arguments.length) return height;
    height = value;
    return chart;
  };

  chart.nodes = function(value) {
    if (!arguments.length) return nodes;
    nodes = value;
    return chart;
  };

  chart.edges = function(value) {
    if (!arguments.length) return edges;
    edges = value;
    return chart;
  };

  chart.fillNode = function(value) {
    if (!arguments.length) return fillNode;
    fillNode = value;
    return chart;
  };

  chart.fillNodeHover = function(value) {
    if (!arguments.length) return fillNodeHover;
    fillNodeHover = value;
    return chart;
  };

  chart.fillNeighbors = function(value) {
    if (!arguments.length) return fillNeighbors;
    fillNeighbors = value;
    return chart;
  };

  chart.radius = function(value) {
    if (!arguments.length) return radius;
    radius = value;
    return chart;
  };

  chart.fillText = function(value) {
    if (!arguments.length) return fillText;
    fillText = value;
    return chart;
  };

  chart.strokeNode = function(value) {
    if (!arguments.length) return strokeNode;
    strokeNode = value;
    return chart;
  };

  chart.strokeLinkHover = function(value) {
    if (!arguments.length) return strokeLinkHover;
    strokeLinkHover = value;
    return chart;
  };

  chart.strokeLink = function(value) {
    if (!arguments.length) return strokeLink;
    strokeLink = value;
    return chart;
  };

  return chart;
}

const width = parseInt(d3.select("#d3-graph").style("width")),
  height = parseInt(d3.select("#d3-graph").style("height"));

const graph = graphChart()
  .width(width)
  .height(height > 500 ? height : 500)
  .fillNode("#758686") // zapolnenie nody
  .strokeNode("#494853") // border nody
  .fillNodeHover("#9d3a43") // navedennaya noda
  .fillNeighbors("#b38a38") // zapolnenie sosedi
  .fillText("#0c0c0c") // cvet texta
  .strokeLinkHover(d3.rgb(255, 0, 0, 0.8)); // cvet svyazei k sosedyam

// const graph_data = {
//   nodes: [
//     {"id": "C1", "label": "Com_1", "amount": 1200000, "info": "-> Com_2 (200000)\n-> Com_3 (200000)\n-> Com_4 (200000)\n-> Com_5 (200000)\n-> Com_6 (200000)\n-> Com_7 (200000)"},
//     {"id": "C2", "label": "Com_2", "amount": 400000, "info": "-> Com_8 (100000)\n-> Com_9 (100000)\n\n<- Com_1 (200000)"},
//     {"id": "C3", "label": "Com_3", "amount": 400000, "info": "-> Com_10 (200000)\n\n<- Com_1 (200000)"},
//     {"id": "C4", "label": "Com_4", "amount": 400000, "info": "-> Com_11 (100000)\n-> Com_12 (100000)\n\n<- Com_1 (200000)"},
//     {"id": "C5", "label": "Com_5", "amount": 400000, "info": "-> Com_13 (200000)\n\n<- Com_1 (200000)"},
//     {"id": "C6", "label": "Com_6", "amount": 400000, "info": "-> Com_14 (200000)\n\n<- Com_1 (200000)"},
//     {"id": "C7", "label": "Com_7", "amount": 400000, "info": "-> Com_15 (200000)\n\n<- Com_1 (200000)"},
//     {"id": "C8", "label": "Com_8", "amount": 200000, "info": "-> Com_15 (100000)\n\n<- Com_2 (100000)"},
//     {"id": "C9", "label": "Com_9", "amount": 200000, "info": "-> Com_16 (100000)\n\n<- Com_2 (100000)"},
//     {"id": "C10", "label": "Com_10", "amount": 400000, "info": "-> Com_17 (200000)\n\n<- Com_3 (200000)"},
//     {"id": "C11", "label": "Com_11", "amount": 200000, "info": "-> Com_17 (100000)\n\n<- Com_4 (100000)"},
//     {"id": "C12", "label": "Com_12", "amount": 200000, "info": "-> Com_18 (100000)\n\n<- Com_4 (100000)"},
//     {"id": "C13", "label": "Com_13", "amount": 400000, "info": "-> Com_19 (100000)\n-> Com_20 (100000)\n\n<- Com_5 (200000)"},
//     {"id": "C14", "label": "Com_14", "amount": 600000, "info": "-> Com_16 (300000)\n\n<- Com_20 (100000)\n<- Com_6 (200000)"},
//     {"id": "C15", "label": "Com_15", "amount": 600000, "info": "-> Com_16 (300000)\n\n<- Com_7 (200000)\n<- Com_8 (100000)"},
//     {"id": "C16", "label": "Com_16", "amount": 1400000, "info": "<- Com_14 (300000)\n<- Com_15 (300000)\n<- Com_9 (100000)"},
//     {"id": "C17", "label": "Com_17", "amount": 600000, "info": "<- Com_10 (200000)\n<- Com_11 (100000)"},
//     {"id": "C18", "label": "Com_18", "amount": 400000, "info": "<- Com_12 (100000)\n<- Com_19 (100000)"},
//     {"id": "C19", "label": "Com_19", "amount": 200000, "info": "-> Com_18 (100000)\n\n<- Com_13 (100000)"},
//     {"id": "C20", "label": "Com_20", "amount": 200000, "info": "-> Com_14 (100000)\n\n<- Com_13 (100000)"}
//   ],
//   edges: [
//     {"source": "C1", "target": "C2"},
//     {"source": "C1", "target": "C3"},
//     {"source": "C1", "target": "C4"},
//     {"source": "C1", "target": "C5"},
//     {"source": "C1", "target": "C6"},
//     {"source": "C1", "target": "C7"},
//     {"source": "C2", "target": "C8"},
//     {"source": "C2", "target": "C9"},
//     {"source": "C3", "target": "C10"},
//     {"source": "C4", "target": "C11"},
//     {"source": "C4", "target": "C12"},
//     {"source": "C5", "target": "C13"},
//     {"source": "C6", "target": "C14"},
//     {"source": "C7", "target": "C15"},
//     {"source": "C8", "target": "C15"},
//     {"source": "C9", "target": "C16"},
//     {"source": "C10", "target": "C17"},
//     {"source": "C11", "target": "C17"},
//     {"source": "C12", "target": "C18"},
//     {"source": "C13", "target": "C19"},
//     {"source": "C13", "target": "C20"},
//     {"source": "C14", "target": "C16"},
//     {"source": "C15", "target": "C16"},
//     {"source": "C19", "target": "C18"},
//     {"source": "C20", "target": "C14"}
//   ]
// }
const graph_data = JSON.parse(
  document.getElementById("dataDiv").dataset.graphdata
);

console.log(graph_data);
d3.select("#d3-graph")
  .datum(graph_data)
  .call(graph);
