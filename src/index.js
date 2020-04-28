import React from "react";
import ReactDOM from 'react-dom';
import dotenv from 'dotenv';
import GoogleTranslate from 'google-translate';

import {
    Dropdown,
    Button,
    Container,
    TextArea,
    Form,
    Message,
} from 'semantic-ui-react';

dotenv.config();

let Translator;

if (process.env.NODE_ENV === 'development') {
    Translator = GoogleTranslate(process.env.REACT_APP_GOOGLE_API_KEY_DEVL, {})
} else {
    Translator = GoogleTranslate(process.env.REACT_APP_GOOGLE_API_KEY_PROD, {})
}

function translateForDropdown(item) {
    return {
        key: item.language,
        text: item.name,
        value: item.name
    }
}

class Obfs extends React.Component {
    constructor(props) {
        super(props);
        var that = this;

        this.state = {
            inputText: "",
            translation: "",
            translatedText: "",
            languages: ["en"],
            SupportedLanguages: [{ key: "af", text: "Afrikaans", value: "Afrikaans" }],
            translationChain: []
        };

        Translator.getSupportedLanguages("en", function (e, b) {
            if (!e) {
                that.setState({
                    SupportedLanguages: b.map(x => translateForDropdown(x))
                });
            } else {
                that.setState({
                    error: true,
                    error_body: JSON.parse(e.body).error
                })
            }
        });

        this.onChange = this.onChange.bind(this);
        this.translate = this.translate.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
    }

    componentDidMount() {
        // this.translate(this.state.inputText, this.state.languages[this.state.languages.length-1]);
    }

    onChange(e) {
        clearTimeout(this.state.stableTimer)
        var timeoutTimer = setTimeout(this.onStable.bind(this, e.target.name), 1000);
        this.setState({
            [e.target.name]: e.target.value,
            stableTimer: timeoutTimer
        });

    }

    onSubmit(e) {
        e.preventDefault();
        clearTimeout(this.state.stableTimer)
        this.translate(this.state.inputText)
        return false;
    }

    onStable(name) {
        if (name === "inputText") {
            this.translate(this.state.inputText)
        }
    }

    translate(text) {
        if (text) {
            this.setState({
                translatedText: this.state.inputText
            });
            this.nextTranslation(text, this.state.languages, 0);
        }
    }

    addLanguage() {
        var languageList = this.state.languages
        if (this.state.newLanguage) {
            if (languageList[languageList.length - 1] !== this.state.newLanguage)
                languageList.push(this.state.newLanguage)
            this.setState({
                languages: languageList
            });
        }
    }

    randomTen() {
        let languageList = []
        this.setState({
            languages: languageList
        })
        let langLength = this.state.SupportedLanguages.length;
        for(var i = 0; i < 9; i++) {
            let randLangIndex = Math.floor(Math.random(0) * langLength)
            let randLanguage = this.state.SupportedLanguages[randLangIndex]
            languageList.push(randLanguage.key)
        }
        languageList.push("en");
        this.setState({
            languages: languageList
        })
    }

    nextTranslation(text, languageList, i) {
        var that = this;
        if (i > languageList.length) {
            return "done"
        }
        Translator.translate(text, languageList[i], function (err, translation) {
            if (err) {
                console.error(err.body);
            } else {
                var chain = that.state.translationChain;
                chain.push(translation.translatedText);
                that.setState({
                    translatedText: translation.translatedText,
                    translationChain: chain,
                    step: i
                });
                return that.nextTranslation(translation.translatedText, languageList, i + 1)
            }
        });
    }

    render() {
        return (<div>
            <Container className="primary">
            <br />
            <h1>Translate <span>Obfuscate</span></h1>
            <br />
            {
                this.state.error &&
                <Message error>
                    <Message.Header>Error</Message.Header>
                    <p>There has been an error loading the backend service. {this.state.error_body.message}</p>
                </Message>
            }
            <Form>
                <Container className="translationContent">
                    <div className="utility-bar">
                        <div className="language-select-container">
                            <LanguageDropdown name="newLanguage" value={this.state.newLanguage} onChange={this.onChange} languages={this.state.SupportedLanguages} />
                            <Button color={"#DA3E52"} onClick={this.addLanguage.bind(this)} className="add-language-button">Add</Button>
                        </div>
                        <LangaugeChain languages={this.state.languages} step={this.state.step}></LangaugeChain>
                    </div>
                    <div className="headerRow">
                        <div className="leftHeader">
                            Input
                        </div>
                        <div className="rightHeader">
                            Output
                        </div>
                        <div className="leftContent">
                            <TextArea name="inputText" placeholder="Input Text" value={this.state.inputText} onChange={this.onChange} />
                        </div>
                        <div className="rightContent">
                            <TextArea name="outputText" value={this.state.translatedText} />
                        </div>
                    </div>
                </Container>
                <br />
                <br />
                <Button primary floated="right" onClick={this.onSubmit}>Translate</Button>
                <Button primary floated="left" onClick={this.randomTen.bind(this)}>Random 10</Button>
                <br />
            </Form>
        </Container>
        <Container className="footer">
        <p>Made by <a href="https://brennanmcdonald.ca">Brennan McDonald</a> - 2020</p>
        </Container>
        </div>)
    }
}

class LanguageDropdown extends React.Component {
    constructor(props) {
        super(props);
        this.onChange = this.onChange.bind(this);
    }

    onChange(_, data) {
        var { value } = data;
        var { key } = data.options.find(o => o.value === value)
        var onChangeResult = {
            target: {
                name: this.props.name,
                value: key
            }
        }
        this.props.onChange(onChangeResult)
    }

    render() {
        return (
            <Dropdown
                className="language-dropdown"
                placeholder='Select Language'
                fluid
                search
                selection
                onChange={this.onChange}
                options={this.props.languages}
            />
        )
    }
}

class LangaugeChain extends React.Component {
    render() {
        return (
            <div className="ribbon-container">
                {
                    this.props.languages.map((x, i) => {
                        if (i === this.props.step) {
                            return <div key={Math.random()} className="ribbon current">{x}</div>
                        } else {
                            return <div key={Math.random()} className="ribbon">{x}</div>
                        }
                    })
                }

            </div>
        )
    }
}

ReactDOM.render(<Obfs />, document.getElementById("root"))