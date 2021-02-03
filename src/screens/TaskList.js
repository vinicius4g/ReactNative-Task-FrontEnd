import React, { Component } from 'react'
import { 
    View, 
    Text, 
    ImageBackground, 
    StyleSheet, 
    FlatList, 
    TouchableOpacity, 
    Platform,
    Alert, 
} from 'react-native'

import AsyncStorage from '@react-native-community/async-storage'
import Icon from 'react-native-vector-icons/FontAwesome'

import moment from 'moment'
import 'moment/locale/pt-br'

import commonStyles from '../commonStyles'
import todayImage from '../../assets/imgs/today.jpg'
import Task from '../components/Task'
import AddTask from './AddTask'

const initialState = { 
    showDoneTasks: true,
    showAddTaskModal: false,
    visibleTasks: [],
    tasks: []   
}

export default class TaskList extends Component {
    state = {
        ...initialState   
    }
    
    //ciclo de vida 
    //assim que o componente for montado ele chama esse metodo de ciclo de vida
    componentDidMount = async () => {
        const stateString = await AsyncStorage.getItem('tasksState')
        const state = JSON.parse(stateString) || initialState
        this.setState(state, this.filterTasks)
    }
    
    //essa funcao ira inverter o valor de estado do showDoneTasks sempre que for chamada
    toggleFilter = () => {
        this.setState({ showDoneTasks: !this.state.showDoneTasks },  this.filterTasks) //passando uma callback depois que o estado for atualizado
    }

    //funcao para mostar ou nao as tasks. (com arrow function o this sempre vai apontar pro componente atual)
    filterTasks = () => {
        let visibleTasks = null
        
        //se o a showDoneTasks for verdadeiro é clonado o array tasks
        if(this.state.showDoneTasks) {
            visibleTasks = [...this.state.tasks]
        }
        else {
            //verifica se task esta pendente, e retorna true ou false
            const pendding = task => task.doneAt === null
            //na linha abaixo filtra somente as tasks pendentes
            visibleTasks = this.state.tasks.filter(pendding)
        }

        //abaixo muda o valor do estado 
        this.setState({ visibleTasks }) // outra forma de implementar seria visibleTasks: visibleTasks
        AsyncStorage.setItem('tasksState', JSON.stringify(this.state))
    }

    toggleTask = taskId => {
        const tasks = [...this.state.tasks] //criando uma copia do array
        tasks.forEach(task => {  //percorrendo cada elemento do array
            if(task.id === taskId) {
                task.doneAt = task.doneAt ? null : new Date() //trocando a data do elemento, para a data de conclusao ser a data do clique do usuario
            }
        })

        this.setState({ tasks: tasks}, this.filterTasks) //alterando o estado a partir dessa funcao, e usando um calback
    }

    //funcao ira adicionar uma nova tasks dentro do estado da aplicacao
    addTask = newTask => {
        if( !newTask.desc || !newTask.desc.trim() ) {
            Alert.alert('Dados Inválidos', 'Descrição não informada !')
            return
        }

        const tasks = [...this.state.tasks]
        tasks.push({
            id: Math.random(),
            desc: newTask.desc,
            estimateAt: newTask.date,
            doneAt: null
        })

        this.setState({ tasks, showAddTaskModal: false }, this.filterTasks) //seta os valores e esconde o modal, e atualizada todas as taks visiveis
    }

    //funcao que ira deletar tasks pelo id (ele pega o id por referencia na chamada)
    deleteTask = id => {
        const tasks = this.state.tasks.filter(task => task.id !== id) 
        this.setState({ tasks }, this.filterTasks) //vai atualiazar o estado com um novo array deiaxndo as tasks nao excluidas
    }

    render() {
        const today = moment().locale('pt-br').format('ddd, D [de] MMMM')
        return (
            <View style={styles.container}>
                <AddTask 
                    isVisible={this.state.showAddTaskModal} 
                    onCancel={() => this.setState({ showAddTaskModal: false })} 
                    onSave={this.addTask}
                />
                <ImageBackground style={styles.background} source={todayImage}>
                    <View style={styles.iconBar}>
                        <TouchableOpacity onPress={this.toggleFilter}>
                            <Icon name={this.state.showDoneTasks ? 'eye' : 'eye-slash' } size={20} color={commonStyles.colors.secondary} />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.titleBar}>
                        <Text style={styles.title}>Hoje</Text>
                        <Text style={styles.subTitle}>{today}</Text>
                    </View>
                </ImageBackground>
                <View style={styles.taskList}>
                   <FlatList data={this.state.visibleTasks}
                        keyExtractor={item => `${item.id}`}
                        renderItem={({item}) => <Task {...item} onToggleTask={this.toggleTask} onDelete={this.deleteTask}/>} //chamando a funcao para alterar o estado
                   />
                </View>   
                <TouchableOpacity 
                    style={styles.addButton} 
                    activeOpacity={0.7}
                    onPress={ () => this.setState({ showAddTaskModal: true})}
                >
                    <Icon 
                        name="plus"
                        size={20}
                        color={commonStyles.colors.secondary}
                    />
                </TouchableOpacity>          
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    background: {
        flex: 3
    },
    taskList: {
        flex: 7
    },
    titleBar: {
        flex: 1,
        justifyContent: 'flex-end'
    },
    title: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 50,
        marginLeft: 20,
        marginBottom: 20
    },
    subTitle: {
        fontFamily: commonStyles.fontFamily,
        color: commonStyles.colors.secondary,
        fontSize: 20,
        marginLeft: 20,
        marginBottom: 30
    },
    iconBar: {
        flexDirection: 'row',
        marginHorizontal: 20,
        justifyContent: 'flex-end',
        marginTop: Platform.OS === 'ios' ? 40 : 10
    },
    addButton: {
        position: 'absolute',
        right: 30,
        bottom: 30,
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: commonStyles.colors.today,
        justifyContent: 'center',
        alignItems: 'center'
    }

})