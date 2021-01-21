Vue.use(Vuex);

const backend = "https://avalonbot.teso.world/crown";
const emptyTotalCrown = {
  Title: "Total (👑)",
  Description: "",
  Price: 0
}
const emptyTotalGold = {
  Title: "Total (💰)",
  Description: "",
  Price: 0
}

const store = new Vuex.Store({
  state: {
    items: [],
    totalCrown: emptyTotalCrown,
    totalGold: emptyTotalGold,
    message: '',
  },
  mutations: {
    del({ items }, id) {
      const i = items.map(item => item.id).indexOf(id);
      items.splice(i, 1);
    },

    updateItems(state, items) {
      state.items.splice(0, state.items.length, ...items);      
      curId = 0;
      state.items.forEach(element => element.id = curId++);
    },

    updateTotalCrown(state, totalCrown) {
      state.totalCrown = totalCrown;
    },

    updateTotalGold(state, totalGold) {
      state.totalGold = totalGold;
    },

    setMessage(state, message) {
      state.message = message;
    }
  },
  actions: {
    async update({ commit }, keys) {
      items = []
      totalCrown = {}
      totalGold = {}
      if (keys.length) {
        const newPost = {
          fromUserID: 'EagleMoor',
          toUserID: 'Kaba4ok',
          items: keys,
        };
        const resp = await axios.post(backend + '/basket/', newPost);
        items = resp.data.items;
        totalCrown = resp.data.totalCrown;
        totalGold = resp.data.totalGold;
      }
      commit("updateItems", items);
      commit("updateTotalCrown", emptyTotalCrown);
      commit("updateTotalGold", emptyTotalGold);
    },

    async add({ dispatch, state }, key) {      
      keys = [...state.items.map(item => item.key), key];
      try {
        dispatch("update", keys);
      } catch (err) {
        console.error(err);
      } 
    },

    async del({ dispatch, state }, id) {
      keys = state.items.map(item => item.key);
      keys.splice(id, 1);      
      try {        
        dispatch("update", keys);
      } catch (err) {
        state.items.splice(0, state.items.length, ...items);
        console.error(err);
      }
    },

    async checkout({state, commit}) {
      // скопировать корзину
      items = [...state.items];
      // очистить корзину
      state.items.splice(0, state.items.length);
      keys = items.map(item => item.key);
      // отправить запрос
      const newPost = {
        fromUserID: 'EagleMoor',
        toUserID: 'Kaba4ok',
        items: keys,
      };
      
      try { // если успешный, очистить корзину, написать успех
        const resp = await axios.post(backend + '/buy/', newPost);
        commit("setMessage", resp.data.message);
      } catch (err) { // если неуспешный, востановить корзину, написать ошибку
        state.items.splice(0, state.items.length, ...items);
        throw err;
      }
    }
  }
})

var app = new Vue({
  el: '#app',
  data() {
    return {
      searchQuery: '',
      fullItems: [],
      items: [],
      modalShow: false,
    }
  },
  watch: {
    async searchQuery(searchQuery) {
      if (!searchQuery) {
        this.items = this.fullItems;
      } else {
        this.items = this.fullItems.filter(item => 
          item.nameRU.toLowerCase().match(searchQuery.toLowerCase()) || item.nameEN.toLowerCase().match(searchQuery.toLowerCase())
        );
      }
    }
  },
  computed: {
    hasNotItems() {
      return Object.keys(this.fullItems).length === 0;
    },
    count() {
	    return store.state.items.length;
    },
    selectedItems() {
      return store.state.items;
    },
    totalCrown() {
      return store.state.totalCrown;
    },
    totalGold() {
      return store.state.totalGold;
    },
    message() {
      return store.state.message;
    }
  },
  methods: {
    add(key) {
      store.dispatch('add', key); 
    },
    del(item) {
      store.dispatch('del', item.id);
    },
    async buy() {
      try {
        await store.dispatch('checkout');
        this.modalShow = true;
      } catch (err) {
        this.modalShow = true;
        store.commit("setMessage", err);
      }
    }
  },
  async mounted() {
    try {
      const response = await axios.get(backend + "/item/");
      this.fullItems = this.items = response.data;
    } catch (err) {
      this.modalShow = true;
      store.commit("setMessage", err);
    }
  }
})