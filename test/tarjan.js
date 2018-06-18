export class Vertex {
  constructor(name) {
    this.name = name || null;
    this.connections = [];
    // used in tarjan algorithm
    // went ahead and explicity initalized them
    this.index = -1;
    this.lowlink = -1;
  }

  equals(vertex) {
    // equality check based on vertex name
    return vertex.name && this.name == vertex.name;
  }
}

export class VertexStack {
  constructor(vertices) {
    this.vertices = vertices || [];
  }
  contains(vertex) {
    for (var i in this.vertices) {
      if (this.vertices[i].equals(vertex)) {
        return true;
      }
    }
    return false;
  }
}
export class Tarjan {
  constructor() {
    this.index = 0;
    this.stack = new VertexStack();
    this.scc = [];
    this.numberOfVertices = 0;
  }

  test(neighbors,undirected=false) {
      this.importGraph(neighbors,undirected)
      this.run()

      if(this.scc[0].length=== neighbors.length) {
        console.log("the graph is fully connected",this.scc)
        return true
      } else {
        console.log("there graph is not fully connected", this.scc)
      }
  }
  importGraph(Neighbors,undirected) {
    this.numberOfVertices = Neighbors.length;
    let vertices = [];
    let neighbors=Neighbors
    if (undirected) {
        neighbors= this.convertGraphToUndirected(Neighbors) 
    }
    
    neighbors.forEach((itsNeighbors, id) => {
      const v = new Vertex(`${id}`);
      vertices.push(v);
    })

    neighbors.forEach((itsNeighbors, id) => {
      itsNeighbors.forEach(neighbor => {
        vertices[id].connections.push(vertices[neighbor]);
      });
    });

    this.vertices = vertices;
  }
  convertGraphToUndirected(Neighbors) {
    let neighbors = Neighbors
    neighbors.forEach((itsNeighbors, id) => {
        itsNeighbors.forEach(neighbor => {
            // neighbors of my neighbor
           if(neighbors[neighbor].indexOf(id)===-1) {
            neighbors[neighbor].push(id)
           } 
        })
    })
    return neighbors
  }

  run() {
    for (var i in this.vertices) {
      if (this.vertices[i].index < 0) {
        this.strongconnect(this.vertices[i]);
      }
    }
    return this.scc;
  }

  strongconnect(vertex) {
    // Set the depth index for v to the smallest unused index
    vertex.index = this.index;
    vertex.lowlink = this.index;
    this.index = this.index + 1;
    this.stack.vertices.push(vertex);

    // Consider successors of v
    // aka... consider each vertex in vertex.connections
    for (var i in vertex.connections) {
      var v = vertex;
      var w = vertex.connections[i];
      if (w.index < 0) {
        // Successor w has not yet been visited; recurse on it
        this.strongconnect(w);
        v.lowlink = Math.min(v.lowlink, w.lowlink);
      } else if (this.stack.contains(w)) {
        // Successor w is in stack S and hence in the current SCC
        v.lowlink = Math.min(v.lowlink, w.index);
      }
    }

    // If v is a root node, pop the stack and generate an SCC
    if (vertex.lowlink == vertex.index) {
      // start a new strongly connected component
      var vertices = [];
      var w = null;
      if (this.stack.vertices.length > 0) {
        do {
          w = this.stack.vertices.pop();
          // add w to current strongly connected component
          vertices.push(w);
        } while (!vertex.equals(w));
      }
      // output the current strongly connected component
      // ... i'm going to push the results to a member scc array variable
      if (vertices.length > 0) {
        this.scc.push(vertices);
      }
    }
  }


}
